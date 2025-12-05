import { Injectable } from '@nestjs/common';
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
}
