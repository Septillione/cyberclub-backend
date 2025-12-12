import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
    constructor(private prisma: PrismaService,) { }

    async create(userId: string, dto: CreateTeamDto) {
        return this.prisma.team.create({
            data: {
                name: dto.name,
                tag: dto.tag,
                avatarUrl: dto.avatarUrl,
                ownerId: userId,
                members: {
                    create: { userId: userId },
                },
            },
            include: { members: { include: { user: true } }, },
        });
    }

    async findAllMyTeams(userId: string) {
        return this.prisma.team.findMany({
            where: {
                members: { some: { userId: userId }, },
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, nickname: true, avatarUrl: true }
                        }
                    }
                },
                _count: { select: { members: true } }
            }
        })
    }

    async findOne(id: string) {
        return this.prisma.team.findUnique({
            where: { id },
            include: {
                owner: { select: { id: true, nickname: true, avatarUrl: true } },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                nickname: true,
                                avatarUrl: true
                            }
                        }
                    }
                },
                _count: { select: { members: true } }
            }
        });
    }

    async joinTeam(userId: string, teamId: string) {
        const existing = await this.prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId } }
        });
        if (existing) throw new ConflictException('Вы уже состоите в этой команде');

        return this.prisma.teamMember.create({
            data: {
                userId,
                teamId,
            }
        });
    }

    async leaveTeam(userId: string, teamId: string) {
        return this.prisma.teamMember.delete({
            where: { teamId_userId: { teamId, userId } }
        });
    }

    async findAll(search?: string) {
        return this.prisma.team.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { tag: { contains: search, mode: 'insensitive' } }
                ]
            } : undefined,
            include: {
                _count: { select: { members: true } }
            }
        });
    }

    // async requestJoin(userId: string, teamId: string) {
    //     return this.prisma.joinRequest.create({
    //         data: { userId, teamId }
    //     })
    // }

    // async getRequest(teamId: string) {
    //     return this.prisma.joinRequest.findMany({
    //         where: { teamId, status: 'PENDING' },
    //         include: { user: { select: { id: true, nickname: true, avatarUrl: true } } }
    //     });
    // }

    // async acceptRequest(requestId: string, captainId: string) {
    //     const request = await this.prisma.joinRequest.findUnique({
    //         where: { id: requestId },
    //         include: { team: true }
    //     });
    //     if (!request || request.team.ownerId !== captainId) throw new ForbiddenException();

    //     return this.prisma.$transaction([
    //         this.prisma.joinRequest.update({
    //             where: { id: requestId },
    //             data: { status: 'ACCEPTED' }
    //         }),
    //         this.prisma.teamMember.create({
    //             data: { userId: request.userId, teamId: request.teamId }
    //         })
    //     ])
    // }
}
