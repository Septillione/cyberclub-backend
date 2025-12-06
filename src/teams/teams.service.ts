import { ConflictException, Injectable } from '@nestjs/common';
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
}
