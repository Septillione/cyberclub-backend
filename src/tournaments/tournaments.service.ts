import { Injectable } from '@nestjs/common';
import { title } from 'process';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';

@Injectable()
export class TournamentsService {
    create(dto: CreateTournamentDto) {
        throw new Error('Method not implemented.');
    }
    constructor(private prisma: PrismaService) { }

    async createTournament(dto: CreateTournamentDto) {
        return this.prisma.tournament.create({
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
                prizePoolString: dto.prizePoolString,
                prizesJson: dto.prizes as any,
                isOnline: dto.isOnline ?? true,
                address: dto.address,
            }
        })
    }

    async findAll() {
        const tournaments = await this.prisma.tournament.findMany({
            include: {
                _count: {
                    select: { entries: true }
                }
            },
            orderBy: {
                startDate: 'asc',
            }
        });

        return tournaments.map(t => ({
            id: t.id,
            title: t.title,
            imageUrl: t.imageUrl,
            discipline: t.discipline,
            status: t.status,
            bracketType: t.bracketType,
            teamMode: t.teamMode,
            prizePool: t.prizePoolString,
            type: t.isOnline ? 'Онлайн' : 'Офлайн',
            address: t.address,
            description: t.description,
            rules: t.rules,
            startDate: t.startDate.toISOString(),
            participants: {
                current: t._count.entries,
                max: t.maxParticipants,
            },
            prizes: t.prizesJson || {},
        }));
    }

    async findOne(id: string) {
        const t = await this.prisma.tournament.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        entries: true
                    }
                },
            },
        });
        if (!t) return null;

        return {
            id: t.id,
            title: t.title,
            imageUrl: t.imageUrl,
            discipline: t.discipline,
            status: t.status,
            bracketType: t.bracketType,
            teamMode: t.teamMode,
            prizePool: t.prizePoolString,
            type: t.isOnline ? 'Онлайн' : 'Офлайн',
            address: t.address,
            description: t.description,
            rules: t.rules,
            startDate: t.startDate.toISOString(),
            participants: {
                current: t._count.entries,
                max: t.maxParticipants,
            },
            prizes: t.prizesJson || {},
        }
    }
}
