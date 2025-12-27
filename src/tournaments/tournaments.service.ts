import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { match } from 'assert';

@Injectable()
export class TournamentsService {
    constructor(private prisma: PrismaService) { }

    private mapTournamentDto(t: any) {
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
            prizes: t.prizesJson || {},
            creatorId: t.creatorId,
        };
    }

    async createTournament(dto: CreateTournamentDto, userId: string) {
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
                prizesJson: dto.prizes as any,
                isOnline: dto.isOnline ?? true,
                address: dto.address,
                creatorId: userId,
                status: 'REGISTRATION_OPEN',
            }
        })
    }

    async findAll() {
        const tournaments = await this.prisma.tournament.findMany({
            include: { _count: { select: { entries: true } } },
            orderBy: { startDate: 'asc' }
        });
        return tournaments.map(this.mapTournamentDto);
    }

    async findOne(id: string) {
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
            prizes: t.prizesJson || {},
            entries: t.entries,
            matches: t.matches,
            creatorId: t.creatorId
        }
    }

    async findUserTournaments(userId: string) {
        const tournaments = await this.prisma.tournament.findMany({
            where: { entries: { some: { userId: userId } } },
            include: { _count: { select: { entries: true } } },
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

    async joinTournament(tournamentId: string, userId: string, teamId?: string) {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { entries: true }
        });

        if (!tournament) throw new NotFoundException('Турнир не найден');
        if (tournament.status !== 'REGISTRATION_OPEN') throw new BadRequestException('Регистрация закрыта');
        if (tournament.entries.length >= tournament.maxParticipants) throw new BadRequestException('Мест больше нет');

        const existingEntry = await this.prisma.tournamentEntry.findFirst({
            where: { tournamentId, userId }
        });
        if (existingEntry) throw new ConflictException('Вы уже зарегистрированы');

        if (tournament.teamMode !== 'SOLO_1V1') {
            if (!teamId) throw new BadRequestException('Для этого турнира нужно выбрать команду');
            const team = await this.prisma.team.findUnique({ where: { id: teamId } });
            if (!team || team.ownerId !== userId) throw new ForbiddenException('Вы должны быть капитаном для регистрации');

            const teamEntry = await this.prisma.tournamentEntry.findFirst({
                where: { tournamentId, teamId }
            });
            if (teamEntry) throw new ConflictException('Эта команда уже участвует');
        }

        return this.prisma.tournamentEntry.create({
            data: {
                tournamentId,
                userId,
                teamId: teamId || null,
                status: 'APPROVED',
            }
        });
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


    }

    // async startTournament(tournamentId: string, userId: string) {
    //     const tournament = await this.prisma.tournament.findUnique({
    //         where: { id: tournamentId },
    //         include: { entries: { include: { user: true, team: true } } }
    //     });

    //     if (!tournament) throw new NotFoundException('Турнир не найден');
    //     if (tournament.creatorId !== userId) throw new ForbiddenException('Только организатор может начать турнир');
    //     if (tournament.status == 'LIVE' || tournament.status == 'FINISHED') throw new BadRequestException('Турнир уже идет или завершён');
    //     if (tournament.entries.length < 2) throw new BadRequestException('Недостаточно участников (минимум 2)');

    //     let participants: (string | null)[] = tournament.entries.map(e => {
    //         return e.team ? e.team.name : e.user.nickname;
    //     });

    //     participants = this.shuffle(participants);

    //     let powerOfTwo = 2;
    //     while (powerOfTwo < participants.length) powerOfTwo *= 2;
    //     while (participants.length < powerOfTwo) participants.push(null);

    //     const matchesData: any[] = [];

    //     for (let i = 0; i < participants.length; i += 2) {
    //         matchesData.push({
    //             tournamentId: tournamentId,
    //             round: 1,
    //             position: i / 2,
    //             participant1: participants[i],
    //             participant2: participants[i + 1],
    //             score1: 0,
    //             score2: 0,
    //         });
    //     }

    //     await this.prisma.$transaction([
    //         this.prisma.tournament.update({
    //             where: { id: tournamentId },
    //             data: { status: 'LIVE' },
    //         }),
    //         this.prisma.match.createMany({
    //             data: matchesData,
    //         })
    //     ]);
    //     return { message: 'Турнир запущен, сетка создана' };
    // }
}