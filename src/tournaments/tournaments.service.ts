import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TournamentsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        const tournaments = await this.prisma.tournament.findMany();
        return tournaments.map((t) => ({
            id: t.id,
            title: t.title,
            imageUrl: t.imageUrl,
            discipline: t.discipline,
            prizePool: t.prizePool,
            type: t.type,
            address: t.address,
            format: t.format,
            formatVersus: t.formatVersus,
            description: t.description,
            rules: t.rules,
            startDate: t.startDate.toISOString(),
            status: t.status,
            participants: {
                currentParticipants: t.currentParticipants,
                maxParticipants: t.maxParticipants,
            },
            prizes: {
                firstPlace: t.prizeFirst,
                secondPlace: t.prizeSecond,
                thirdPlace: t.prizeThird,
            },
            registeredPlayerIds: [],
        }));
    }

    async findOne(id: string) {
        const t = await this.prisma.tournament.findUnique({ where: { id } });
        if (!t) return null;

        return {
            id: t.id,
            title: t.title,
            imageUrl: t.imageUrl,
            discipline: t.discipline,
            prizePool: t.prizePool,
            type: t.type,
            address: t.address,
            format: t.format,
            formatVersus: t.formatVersus,
            description: t.description,
            rules: t.rules,
            startDate: t.startDate.toISOString(),
            status: t.status,
            participants: {
                currentParticipants: t.currentParticipants,
                maxParticipants: t.maxParticipants,
            },
            prizes: {
                firstPlace: t.prizeFirst,
                secondPlace: t.prizeSecond,
                thirdPlace: t.prizeThird,
            },
            registeredPlayerIds: [],
        }
    }
}
