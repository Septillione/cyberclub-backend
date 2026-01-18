import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { JoinRequestStatus, TypeNotification } from '@prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
    constructor(private prisma: PrismaService, private notifications: NotificationsService) { }

    async create(userId: string, dto: CreateTeamDto) {
        // Проверка на уникальность имени/тега
        const existing = await this.prisma.team.findFirst({
            where: {
                OR: [{ name: dto.name }, { tag: dto.tag }]
            }
        });
        if (existing) throw new ConflictException('Команда с таким именем или тегом уже существует');

        return this.prisma.team.create({
            data: {
                name: dto.name,
                tag: dto.tag,
                description: dto.description,
                socialMedia: dto.socialMedia,
                gamesList: dto.gamesList,
                avatarUrl: dto.avatarUrl,
                ownerId: userId,
                // Сразу добавляем создателя в список участников
                members: {
                    create: { userId: userId },
                },
            },
            include: { members: { include: { user: true } } },
        });
    }

    async findAllMyTeams(userId: string) {
        return this.prisma.team.findMany({
            where: {
                members: { some: { userId: userId } },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, nickname: true, avatarUrl: true } }
                    }
                },
                _count: { select: { members: true } }
            }
        })
    }

    async findOne(id: string) {
        const team = await this.prisma.team.findUnique({
            where: { id },
            include: {
                owner: { select: { id: true, nickname: true, avatarUrl: true } },
                members: {
                    include: {
                        user: { select: { id: true, nickname: true, avatarUrl: true } }
                    }
                },
                _count: { select: { members: true } },
                entries: {
                    include: {
                        tournament: {
                            include: {
                                _count: { select: { entries: true } }
                            }
                        }
                    },
                    orderBy: {
                        registeredAt: 'desc',
                    }
                }
            }
        });

        if (!team) return null;

        const mappedEntries = team.entries.map((entry) => {
            const t = entry.tournament;
            return {
                ...entry,
                tournament: {
                    id: t.id,
                    title: t.title,
                    imageUrl: t.imageUrl,
                    discipline: t.discipline,
                    status: t.status,
                    bracketType: t.bracketType,
                    teamMode: t.teamMode,
                    isOnline: t.isOnline,
                    address: t.address,
                    description: t.description,
                    rules: t.rules,
                    startDate: t.startDate.toISOString(),
                    participants: {
                        current: t._count.entries,
                        max: t.maxParticipants,
                    },
                    prizes: t.prizesJson || [],
                    entries: [],
                    matches: [],
                    creatorId: t.creatorId
                }
            }
        });

        return {
            ...team,
            entries: mappedEntries
        };
    }

    // Поиск команд (для экрана поиска)
    async findAll(search?: string) {
        if (search) {

            return this.prisma.team.findMany({
                where: {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { tag: { contains: search, mode: 'insensitive' } }
                    ]
                },
                take: 10,
                include: {
                    _count: { select: { members: true } }
                }
            });
        }
        return this.prisma.team.findMany({
            take: 10,
            include: {
                _count: { select: { members: true } }
            }
        })
    }

    // --- Логика заявок (Join Requests) ---

    async requestJoin(userId: string, teamId: string) {
        // Проверка: не состоит ли уже?
        const member = await this.prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId } }
        });
        if (member) throw new ConflictException('Вы уже в команде');

        // Проверка: есть ли уже заявка?
        const existingReq = await this.prisma.joinRequest.findUnique({
            where: { userId_teamId: { userId, teamId } }
        });
        if (existingReq && existingReq.status === 'PENDING') {
            throw new ConflictException('Заявка уже отправлена');
        }

        const request = await this.prisma.joinRequest.create({ data: { userId, teamId } });
        const team = await this.prisma.team.findUnique({ where: { id: teamId } });
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (team) {
            await this.notifications.sendNotification(
                team.ownerId,
                'Новая заявка',
                `Игрок ${user?.nickname} хочет вступить в команду`,
                TypeNotification.INVITE,
                { teamId: team.id }
            );
        }

        return request;
    }

    async getRequests(teamId: string) {
        return this.prisma.joinRequest.findMany({
            where: { teamId, status: 'PENDING' },
            include: { user: { select: { id: true, nickname: true, avatarUrl: true } } }
        });
    }

    async acceptRequest(requestId: string, captainId: string) {
        const request = await this.prisma.joinRequest.findUnique({
            where: { id: requestId },
            include: { team: true }
        });
        if (!request || request.team.ownerId !== captainId) throw new ForbiddenException('Только капитан может принимать заявки');

        const team = await this.prisma.team.findUnique({
            where: { id: request.teamId },
            include: {
                members: true
            },
        })

        if (!team) throw new NotFoundException('Команда не найдена');

        if (team.members.length >= 10) throw new BadRequestException('Команда переполнена');

        return this.prisma.$transaction([
            this.prisma.joinRequest.update({
                where: { id: requestId },
                data: { status: JoinRequestStatus.ACCEPTED }
            }),
            this.prisma.teamMember.create({
                data: { userId: request.userId, teamId: request.teamId }
            })
        ])
    }

    async rejectRequest(requestId: string, captainId: string) {
        const request = await this.prisma.joinRequest.findUnique({
            where: { id: requestId },
            include: { team: true }
        });

        if (!request || request.team.ownerId !== captainId) throw new ForbiddenException('Только капитан может отклонять заявки');

        return this.prisma.joinRequest.update({
            where: { id: requestId },
            data: { status: JoinRequestStatus.REJECTED }
        })
    }

    // Выход / Удаление (доп. методы)
    async leaveTeam(userId: string, teamId: string) {
        const team = await this.prisma.team.findUnique({ where: { id: teamId } });

        // 1. Сначала проверяем, нашлась ли команда
        if (!team) {
            throw new NotFoundException('Команда не найдена');
        }

        // 2. Теперь TypeScript знает, что team точно не null, и ошибка пропадет
        if (team.ownerId === userId) {
            throw new ForbiddenException('Капитан не может покинуть команду. Передайте права или удалите команду.');
        }

        return this.prisma.teamMember.delete({
            where: { teamId_userId: { teamId, userId } }
        });
    }

    async deleteTeam(userId: string, teamId: string) {
        const team = await this.prisma.team.findUnique({ where: { id: teamId } });

        if (!team) {
            throw new NotFoundException('Команда не найдена');
        }

        if (team.ownerId !== userId) {
            throw new ForbiddenException('Только капитан может удалить команду');
        }

        await this.prisma.$transaction([
            this.prisma.joinRequest.deleteMany({ where: { teamId } }),
            this.prisma.teamMember.deleteMany({ where: { teamId } }),
            this.prisma.team.delete({ where: { id: teamId } }),
        ])
    }

    // Метод joinTeam (прямой вход) мы убираем или оставляем для тестов, 
    // так как у нас есть система заявок (requestJoin).
    // Если хочешь оставить "мгновенный вход" для отладки:
    async joinTeam(userId: string, teamId: string) {
        return this.prisma.teamMember.create({ data: { userId, teamId } });
    }

    async inviteUser(captainId: string, teamId: string, targetUserId: string) {
        const team = await this.prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
        if (!team) throw new NotFoundException('Команда не найдена');
        if (team.ownerId !== captainId) throw new ForbiddenException('Только капитан может приглашать');

        const existingMember = await this.prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: targetUserId } }
        });
        if (existingMember) throw new ConflictException('Игрок уже в команде');

        if (team.members.length >= 10) throw new BadRequestException('Команда переполнена');

        await this.notifications.sendNotification(
            targetUserId,
            'Приглашение в команду',
            `Вы были приглашены в команду ${team.name}`,
            'INVITE',
            { teamId: team.id }
        );

        return { message: 'Приглашение отправлено' };
    }

    async updateTeam(userId: string, teamId: string, dto: UpdateTeamDto) {
        const team = await this.prisma.team.findUnique({ where: { id: teamId } });

        if (!team) {
            throw new NotFoundException('Команда не найдена');
        }

        if (team.ownerId !== userId) {
            throw new ForbiddenException('Только капитан может обновлять информацию о команде');
        }

        return this.prisma.team.update({
            where: { id: teamId },
            data: {
                name: dto.name,
                tag: dto.tag,
                avatarUrl: dto.avatarUrl,
                description: dto.description,
                socialMedia: dto.socialMedia,
                gamesList: dto.gamesList,
            }
        })
    }
}