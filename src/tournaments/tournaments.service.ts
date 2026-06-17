import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { match } from 'assert';
import * as crypto from 'crypto';
import { FitlerTournamentsDto } from './dto/filter-tournaments.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { title } from 'process';
import { NotificationsService } from 'src/notifications/notifications.service';
import { TypeNotification } from '@prisma/client';


@Injectable()
export class TournamentsService {
    constructor(private prisma: PrismaService, private notifications: NotificationsService) { }

    // private mapTournamentDto(t: any) {
    //     return {
    //         id: t.id,
    //         title: t.title,
    //         imageUrl: t.imageUrl,
    //         discipline: t.discipline,
    //         status: t.status,
    //         bracketType: t.bracketType,
    //         teamMode: t.teamMode,
    //         isOnline: t.isOnline,
    //         address: t.address,
    //         description: t.description,
    //         rules: t.rules,
    //         startDate: t.startDate.toISOString(),
    //         participants: {
    //             current: t._count?.entries ?? 0,
    //             max: t.maxParticipants,
    //         },
    //         prizes: t.prizesJson || {},
    //         creatorId: t.creatorId,
    //         matches: t.matches || [],
    //         entries: t.entries || [],
    //     };
    // }

    private mapTournamentDto(t: any) {
        const mappedEntries = (t.entries || []).map(entry => ({
            id: entry.id,
            userId: entry.userId,
            teamId: entry.teamId,
            status: entry.status,
            user: entry.user ? {
                id: entry.user.id,
                nickname: entry.user.nickname,
                avatarUrl: entry.user.avatarUrl || null
            } : null,
            team: entry.team ? {
                id: entry.team.id,
                name: entry.team.name,
                tag: entry.team.tag,
                avatarUrl: entry.team.avatarUrl || null
            } : null,
        }));

        return {
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
            startDate: t.startDate ? t.startDate.toISOString() : new Date(0).toISOString(),

            participants: {
                current: t._count?.entries ?? 0,
                max: t.maxParticipants,
            },
            prizes: Array.isArray(t.prizesJson) ? t.prizesJson : [],
            creatorId: t.creatorId,
            matches: t.matches || [],
            entries: mappedEntries,
            createdAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
        };
    }



    async createTournament(dto: CreateTournamentDto, userId: string) {
        const tournament = await this.prisma.tournament.create({
            data: {
                title: dto.title,
                description: dto.description,
                rules: dto.rules,
                discipline: dto.discipline,
                imageUrl: dto.imageUrl,
                startDate: new Date(dto.startDate),
                maxParticipants: dto.maxParticipants,
                bracketType: dto.bracketType,
                teamMode: dto.teamMode,
                prizesJson: dto.prizes as any,
                isOnline: dto.isOnline ?? true,
                address: dto.address,
                creatorId: userId,
                status: 'REGISTRATION_OPEN',
            }
        });

        this.notifications.sendNotification(
            userId,
            'Создание турнира',
            `Турнир ${tournament.title} успешно создан`,
            TypeNotification.SYSTEM,
        ).catch(err => console.error(err));

        return tournament;
    }

    async findAll(filters: FitlerTournamentsDto) {
        try {
            const { discipline, status, teamMode, search, isOnline, sortOrder } = filters;

            console.log('--- START FILTER DEBUG ---');
            console.log('Raw Filters received:', filters);


            const where: any = {};

            if (discipline) where.discipline = discipline;
            if (status) where.status = status;
            if (teamMode) where.teamMode = teamMode;
            if (isOnline !== undefined) where.isOnline = isOnline;

            if (search && search.trim().length > 0) {
                const cleanSearch = search.trim();

                if (!where.AND) where.AND = [];

                if (cleanSearch.length < 3) {
                    where.AND.push({
                        title: { contains: cleanSearch, mode: 'insensitive' }
                    });
                } else {
                    const trigrams: string[] = [];

                    for (let i = 0; i < cleanSearch.length - 2; i++) {
                        trigrams.push(cleanSearch.substring(i, i + 3));
                    }

                    where.AND.push({
                        OR: trigrams.map(chunk => ({
                            title: { contains: chunk, mode: 'insensitive' }
                        }))
                    });
                }
            }

            console.log('Constructed WHERE:', JSON.stringify(where, null, 2));
            console.log('--- END FILTER DEBUG ---');

            let orderBy: any = { startDate: 'asc' };
            if (sortOrder === 'NEWEST') orderBy = { startDate: 'desc' };
            else if (sortOrder === 'OLDEST') orderBy = { startDate: 'asc' };
            else if (sortOrder === 'POPULAR') orderBy = { entries: { _count: 'desc' } };

            const tournaments = await this.prisma.tournament.findMany({
                where: where,
                include: {
                    _count: { select: { entries: true } },
                    matches: true,
                    entries: { include: { user: true, team: true } }
                },
                orderBy: orderBy,
            });

            return tournaments.map(this.mapTournamentDto);
        } catch (error) { // ✅ Ловим ошибку
            console.error('!!! ERROR IN FIND ALL !!!', error);
            throw error;
        }
    }

    async findOne(id: string) {
        try {
            const t = await this.prisma.tournament.findUnique({
                where: { id },
                include: {
                    _count: { select: { entries: true } },
                    entries: {
                        select: {
                            id: true,
                            userId: true,
                            teamId: true,
                            status: true,
                            user: { select: { id: true, nickname: true, avatarUrl: true } },
                            team: { select: { id: true, name: true, tag: true, avatarUrl: true } }
                        }
                    },
                    matches: true
                },
            });
            if (!t) return null;

            console.log('--- FIND ONE DEBUG ---');
            console.log('Prizes from DB:', t.prizesJson);
            console.log('CreatedAt from DB:', t.createdAt);
            console.log('----------------------');


            const mappedEntries = t.entries.map(entry => ({
                id: entry.id,
                userId: entry.userId,
                teamId: entry.teamId,
                status: entry.status,
                // Безопасно обрабатываем null, если user или team не найдены
                user: entry.user ? {
                    id: entry.user.id,
                    nickname: entry.user.nickname,
                    avatarUrl: entry.user.avatarUrl || null
                } : null,
                team: entry.team ? {
                    id: entry.team.id,
                    name: entry.team.name,
                    tag: entry.team.tag,
                    avatarUrl: entry.team.avatarUrl || null
                } : null,
            }));


            return {
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
                prizes: Array.isArray(t.prizesJson) ? t.prizesJson : [],
                entries: mappedEntries,
                matches: t.matches,
                creatorId: t.creatorId,
                createdAt: t.createdAt ? t.createdAt.toISOString() : new Date(0).toISOString(),
            }
        } catch (error) {
            // ✅ Ловим любую ошибку и выводим в консоль
            console.error('!!! ERROR IN FIND ONE !!!', error);
            // Выбрасываем ошибку дальше, чтобы Nest.js ее обработал
            throw error;
        }
    }

    async findUserTournaments(userId: string) {
        const tournaments = await this.prisma.tournament.findMany({
            where: { entries: { some: { userId: userId } } },
            include: {
                _count: {
                    select: {
                        entries: true
                    }
                },
                matches: true,
                entries: {
                    include: {
                        user: true,
                        team: true,
                    }
                }
            },
            orderBy: { startDate: 'desc' }
        });
        return tournaments.map(this.mapTournamentDto);
    }

    async findMyCreated(userId: string) {
        const tournaments = await this.prisma.tournament.findMany({
            where: { creatorId: userId },
            orderBy: { startDate: 'desc' },
            include: { _count: { select: { entries: true } } }
        });
        return tournaments.map(this.mapTournamentDto);
    }

    async joinTournament(tournamentId: string, userId: string, teamId?: string, rosterIds?: string[]) {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                _count: {
                    select: { entries: true }
                }
            }
        });

        if (!tournament) throw new NotFoundException('Турнир не найден');
        if (tournament.status !== 'REGISTRATION_OPEN') throw new BadRequestException('Регистрация закрыта');

        const currentParticipants = tournament._count.entries;
        if (currentParticipants >= tournament.maxParticipants) throw new BadRequestException('Мест больше нет');

        const existingEntry = await this.prisma.tournamentEntry.findFirst({
            where: { tournamentId, userId }
        });
        if (existingEntry) throw new ConflictException('Вы уже зарегистрированы');

        if (tournament.teamMode !== 'SOLO_1V1') {
            if (!teamId) throw new BadRequestException('Для этого турнира нужно выбрать команду');
            const team = await this.prisma.team.findUnique({ where: { id: teamId } });
            console.log('--- JOIN TOURNAMENT DEBUG ---');
            console.log('User ID from token:', userId);
            console.log('Team ID from request:', teamId);
            console.log('Team Owner ID from DB:', team?.ownerId);
            console.log('Is user the owner?', team?.ownerId === userId);
            console.log('Received rosterIds:', rosterIds); // <-- Очень важный лог
            console.log('-----------------------------');


            if (!team || team.ownerId !== userId) throw new ForbiddenException('Вы должны быть капитаном для регистрации');

            const teamEntry = await this.prisma.tournamentEntry.findFirst({
                where: { tournamentId, teamId }
            });
            if (teamEntry) throw new ConflictException('Эта команда уже участвует');

            const requiredCount = tournament.teamMode === 'DUO_2V2' ? 2 : tournament.teamMode === 'SQUAD' ? 4 : 5;

            if (!rosterIds || rosterIds.length !== requiredCount) {
                throw new BadRequestException(`Нужно выбрать ровно ${requiredCount} игроков`);
            }

            const members = await this.prisma.teamMember.count({
                where: {
                    teamId,
                    userId: { in: rosterIds }
                }
            });

            if (members !== rosterIds.length) {
                throw new BadRequestException('Выбраны игроки не из вашей команды');
            }
        }

        await this.prisma.$transaction(async (tx) => {
            const entry = await tx.tournamentEntry.create({
                data: {
                    tournamentId,
                    userId,
                    teamId: teamId || null,
                    // rosterJson: rosterIds || [],
                    rosterJson: JSON.stringify(rosterIds || []),
                    status: 'APPROVED',
                }
            });

            if (currentParticipants + 1 >= tournament.maxParticipants) {
                await tx.tournament.update({
                    where: { id: tournamentId },
                    data: { status: 'REGISTRATION_CLOSED' }
                });
            }

            return entry;
        });

        this.notifications.sendNotification(
            userId,
            'Участие в турнире',
            `Ваша заявка принята. Турнир: ${tournament.title}`,
            TypeNotification.SYSTEM,
        ).catch(console.error);

        if (teamId && rosterIds && rosterIds.length > 0) {
            const teammatesToNotify = rosterIds.filter(id => id !== userId);

            for (const memberId of teammatesToNotify) {
                this.notifications.sendNotification(
                    memberId,
                    'Турнир!',
                    `Капитан зарегистрировал вашу команду в турнире ${tournament.title}`,
                    TypeNotification.INFO,
                ).catch(console.error);
            }
        }

        return { message: 'Вы успешно зарегистрированы' };
    }

    private shuffle(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    async startTournament(tournamentId: string, userId: string) {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { entries: { include: { user: true, team: true } } }
        });

        if (!tournament) throw new NotFoundException('Турнир не найден');
        if (tournament.creatorId !== userId) throw new ForbiddenException('Только организатор может начать турнир');
        if (tournament.status == 'LIVE' || tournament.status == 'FINISHED') throw new BadRequestException('Турнир уже идет или завершён');
        if (tournament.entries.length < 2) throw new BadRequestException('Недостаточно участников (минимум 2)');

        let participants: (string | null)[] = tournament.entries.map(e => e.team ? e.team.name : e.user.nickname);
        participants = this.shuffle(participants);

        let powerOfTwo = 2;
        while (powerOfTwo < participants.length) powerOfTwo *= 2;
        while (participants.length < powerOfTwo) participants.push(null);

        const createdMatches: any[][] = [];

        let currentRoundParticipants = participants;
        let rouandNumber = 1;

        const dbOperaions: any[] = [];

        dbOperaions.push(
            this.prisma.tournament.update({
                where: { id: tournamentId }, data: { status: 'LIVE' }
            })
        );

        while (currentRoundParticipants.length > 1) {
            const nextRoundParticipants: any[] = [];
            const matchesInThisRound: any[] = [];

            for (let i = 0; i < currentRoundParticipants.length; i += 2) {
                const matchId = crypto.randomUUID();

                const matchData = {
                    id: matchId,
                    tournamentId: tournamentId,
                    round: rouandNumber,
                    position: i / 2,
                    participant1: rouandNumber === 1 ? currentRoundParticipants[i] : null,
                    participant2: rouandNumber === 1 ? currentRoundParticipants[i + 1] : null,
                    score1: 0,
                    score2: 0,
                    nextMatchId: null as string | null,
                };

                matchesInThisRound.push(matchData);
                nextRoundParticipants.push(matchData);
            }

            createdMatches.push(matchesInThisRound);
            currentRoundParticipants = nextRoundParticipants;
            rouandNumber++;
        }

        for (let r = 0; r < createdMatches.length - 1; r++) {
            const currentRound = createdMatches[r];
            const nextRound = createdMatches[r + 1];

            for (const match of currentRound) {
                const nextMatchPos = Math.floor(match.position / 2);
                const nextMatch = nextRound.find(m => m.position === nextMatchPos);

                if (nextMatch) {
                    match.nextMatchId = nextMatch.id;
                }
            }
        }

        const allMatchesFlat = createdMatches.flat();

        for (let r = createdMatches.length - 1; r >= 0; r--) {
            dbOperaions.push(
                this.prisma.match.createMany({ data: createdMatches[r] })
            );
        }

        await this.prisma.$transaction(dbOperaions);

        this.notifications.sendNotification(
            userId,
            'Запуск турнира',
            `Турнир ${tournament.title} успешно запущен`,
            TypeNotification.SYSTEM,
        ).catch(err => console.error(err));

        return { message: 'Турнир запущен, полная сетка создана' };
    }

    async updateMatch(matchId: string, userId: string, score1: number, score2: number) {
        // 1. Ищем матч и проверяем права
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            include: { tournament: true }
        });

        if (!match) throw new NotFoundException('Матч не найден');
        // Проверка: менять счет может только создатель
        if (match.tournament.creatorId !== userId) throw new ForbiddenException('Нет прав');
        if (match.tournament.status === 'FINISHED') throw new BadRequestException('Турнир завершен, счет изменять нельзя')

        // 2. Определяем победителя
        // ВАЖНО: Мы используем имена (строки), так как в базе у нас participant1/participant2 - это строки
        let winnerName: string | null = null;

        if (score1 > score2) {
            winnerName = match.participant1;
        } else if (score2 > score1) {
            winnerName = match.participant2;
        }
        // Если ничья (score1 == score2), победителя нет, winnerName остается null

        const ops: any[] = [];

        // 3. Обновляем ТЕКУЩИЙ матч (записываем счет и победителя)
        ops.push(this.prisma.match.update({
            where: { id: matchId },
            data: { score1, score2, winnerId: winnerName }
        }));

        // 4. ПРОДВИГАЕМ ПОБЕДИТЕЛЯ (Самая важная часть!)
        // Если победитель определен И есть куда идти (nextMatchId не null)
        // if (winnerName && match.nextMatchId) {

        //     // Логика:
        //     // Если позиция матча четная (0, 2, 4...) -> победитель идет в слот 1 (верхний) следующего матча
        //     // Если позиция матча нечетная (1, 3, 5...) -> победитель идет в слот 2 (нижний) следующего матча
        //     const isSlot1 = (match.position % 2 === 0);

        //     const updateData = isSlot1
        //         ? { participant1: winnerName }
        //         : { participant2: winnerName };

        //     // Добавляем операцию обновления СЛЕДУЮЩЕГО матча
        //     ops.push(this.prisma.match.update({
        //         where: { id: match.nextMatchId },
        //         data: updateData
        //     }));
        // }

        if (winnerName) {
            if (match.nextMatchId) {
                const isSlot1 = (match.position % 2 === 0);
                const updateData = isSlot1 ? { participant1: winnerName } : { participant2: winnerName };

                ops.push(this.prisma.match.update({
                    where: { id: match.nextMatchId },
                    data: updateData
                }));
            } else {
                if (match.tournament.teamMode === 'SOLO_1V1') {
                    const winnerUser = await this.prisma.user.findUnique({
                        where: { nickname: winnerName }
                    });

                    if (winnerUser) {
                        ops.push(this.prisma.tournament.update({
                            where: { id: match.tournamentId },
                            data: {
                                status: 'FINISHED',
                                winnerUserId: winnerUser.id
                            }
                        }));
                    }
                } else {
                    const winnerTeam = await this.prisma.team.findUnique({
                        where: { name: winnerName }
                    });

                    if (winnerTeam) {
                        ops.push(this.prisma.tournament.update({
                            where: { id: match.tournamentId },
                            data: {
                                status: 'FINISHED',
                                winnerTeamId: winnerTeam.id
                            }
                        }));
                    }
                }
            }
        }

        // Выполняем всё вместе
        await this.prisma.$transaction(ops);

        this.notifications.sendNotification(
            userId,
            'Обновление матча',
            `Счёт матча турнира ${match.tournament.title} успешно обновлён`,
            TypeNotification.SYSTEM,
        ).catch(err => console.error(err));

        return { message: 'Счет обновлен, сетка пересчитана' };
    }

    async disqualifyParticipant(matchId: string, userId: string, loserParticipant: number) {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            include: { tournament: true }
        });

        if (!match) throw new NotFoundException('Матч не найден');
        if (match.tournament.creatorId !== userId) throw new ForbiddenException('Нет прав');
        if (match.tournament.status === 'FINISHED') throw new BadRequestException('Турнир завершен');
        if (match.winnerId) throw new BadRequestException('У матча уже есть победитель');

        let winnerName: string | null = null;
        let score1 = 0;
        let score2 = 0;

        if (loserParticipant === 1) {
            winnerName = match.participant2;
            if (!winnerName) throw new BadRequestException('Нет второго участника');
            score1 = 0;
            score2 = 1;
        } else {
            winnerName = match.participant1;
            if (!winnerName) throw new BadRequestException('Нет первого участника');
            score1 = 1;
            score2 = 0;
        }

        const ops: any[] = [];

        ops.push(this.prisma.match.update({
            where: { id: matchId },
            data: { score1, score2, winnerId: winnerName },
        }));

        if (match.nextMatchId) {
            const isSlot1 = (match.position % 2 == 0);
            const updateData = isSlot1 ? { participant1: winnerName } : { participant2: winnerName };

            ops.push(this.prisma.match.update({
                where: { id: match.nextMatchId },
                data: updateData,
            }));
        }

        await this.prisma.$transaction(ops);

        this.notifications.sendNotification(
            userId,
            'Дисквалификация игрока',
            `Участник дисквалифицирован, соперник прошел дальше`,
            TypeNotification.SYSTEM,
        ).catch(err => console.error(err));

        return { message: 'Участник дисквалифицирован, соперник прошел дальше' };
    }

    async finishTournament(tournamentId: string, userId: string) {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
        });

        if (!tournament) throw new NotFoundException('Турнир не найден');
        if (tournament.creatorId !== userId) throw new ForbiddenException('Только организатор может завершить турнир');
        if (tournament.status !== 'LIVE') throw new BadRequestException('Турнир не запущен');

        await this.prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: 'FINISHED' },
        });

        this.notifications.sendNotification(
            userId,
            'Завершение турнира',
            `Турнир ${tournament.title} успешно завершён`,
            TypeNotification.SYSTEM,
        ).catch(err => console.error(err));
    }

    async cancelTournament(tournamentId: string) {
        await this.prisma.tournament.update({
            where: {
                id: tournamentId
            },
            data: {
                status: 'CANCELLED',
                entries: {
                    deleteMany: {}
                }
            }
        });
    }

    async getAdminDashboardStats() {
        const totalTournaments = await this.prisma.tournament.count();
        const liveTournaments = await this.prisma.tournament.count({
            where: { status: 'LIVE' }
        });
        const openTournaments = await this.prisma.tournament.count({
            where: { status: 'REGISTRATION_CLOSED' }
        });

        const totalUsers = await this.prisma.user.count();
        const usersInTeams = await this.prisma.user.count({
            where: {
                teamMember: { some: {} }
            }
        });
        const usersPlayingNow = await this.prisma.user.count({
            where: {
                OR: [
                    {
                        entries: {
                            some: {
                                tournament: { status: 'LIVE' }
                            }
                        }
                    },
                    {
                        teamMember: {
                            some: {
                                team: {
                                    entries: {
                                        some: {
                                            tournament: { status: 'LIVE' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        });

        const totalTeams = await this.prisma.team.count();
        const activeTeams = await this.prisma.team.count({
            where: {
                entries: {
                    some: {
                        tournament: {
                            status: 'LIVE'
                        }
                    }
                }
            }
        });
        const totalJoinRequests = await this.prisma.joinRequest.count();

        return {
            tournaments: { total: totalTournaments, live: liveTournaments, open: openTournaments },
            users: { total: totalUsers, inTeams: usersInTeams, playingNow: usersPlayingNow },
            teams: { total: totalTeams, active: activeTeams, joinRequests: totalJoinRequests },
        }
    }

    async updateTournament(tournamentId: string, userId: string, userRole: string, dto: UpdateTournamentDto) {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
        });

        if (!tournament) {
            throw new NotFoundException('Турнир не найден');
        }

        if (userId !== tournament.creatorId && userRole !== 'MANAGER' && userRole !== 'ADMIN') {
            throw new ForbiddenException('Только организатор может обновить турнир');
        }

        if (tournament.status === 'LIVE' && (dto.teamMode || dto.bracketType || dto.maxParticipants)) {
            throw new BadRequestException('Нельзя менять формат активного турнира');
        }

        try {
            const dataToUpdate: any = { ...dto };

            if (dto.startDate) {
                dataToUpdate.startDate = new Date(dto.startDate);
            }

            if (dto.prizes) {
                dataToUpdate.prizesJson = dto.prizes;
                delete dataToUpdate.prizes;
            }

            await this.prisma.tournament.update({
                where: { id: tournamentId },
                data: dataToUpdate,
            })
        } catch (e) {
            throw new BadRequestException('Ошибка обновления турнира: ' + e.message);
        }

        this.notifications.sendNotification(
            userId,
            'Изменение турнира',
            `Турнир ${tournament.title} успешно изменён`,
            TypeNotification.SYSTEM,
        ).catch(err => console.error(err));
    }
}