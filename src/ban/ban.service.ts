import { Injectable, NotFoundException } from '@nestjs/common';
import { TypeNotification } from '@prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BanService {
    constructor(private prisma: PrismaService, private notifications: NotificationsService) { }

    async banUser(adminId: string, userId: string, reason: string, days?: number) {
        const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) throw new NotFoundException('Игрок не найден');

        await this.prisma.$transaction(async (tx) => {
            await tx.banHistory.create({
                data: {
                    userId,
                    issureId: adminId,
                    reason,
                    type: days ? 'TEMPORARY' : 'PERMANENT',
                    expiresAt,
                    isActive: true,
                }
            });

            return tx.user.update({
                where: { id: userId },
                data: {
                    isBanned: true,
                    banReason: reason,
                    banExpires: expiresAt,
                }
            });
        });

        this.notifications.sendNotification(
            adminId,
            'Бан игрока',
            `Игрок ${user.nickname} забанен`,
            TypeNotification.SYSTEM,
        ).catch(err => console.error(err));
    }

    async unbanUser(userId: string) {
        await this.prisma.$transaction(async (tx) => {
            await tx.banHistory.updateMany({
                where: { userId, isActive: true },
                data: { isActive: false }
            });

            return tx.user.update({
                where: { id: userId },
                data: { isBanned: false, banReason: null, banExpires: null }
            });
        });
    }

    async banTeam(adminId: string, teamId: string, reason: string, days?: number) {
        const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
        });

        if (!team) throw new NotFoundException('Команда не найдена');

        await this.prisma.$transaction(async (tx) => {
            await tx.banHistory.create({
                data: {
                    teamId: teamId,
                    issureId: adminId,
                    reason,
                    type: days ? 'TEMPORARY' : 'PERMANENT',
                    expiresAt,
                    isActive: true,
                }
            });

            await tx.team.update({
                where: { id: teamId },
                data: {
                    isBanned: true,
                    banReason: reason,
                    banExpires: expiresAt,
                }
            });
        });

        this.notifications.sendNotification(
            adminId,
            'Бан команды',
            `Команда ${team.name} забанена`,
            TypeNotification.SYSTEM,
        ).catch(err => console.error(err));
    }

    async unbanTeam(teamId: string) {
        return this.prisma.$transaction(async (tx) => {
            await tx.banHistory.updateMany({
                where: { teamId, isActive: true },
                data: { isActive: false }
            });

            await tx.team.update({
                where: { id: teamId },
                data: {
                    isBanned: false,
                    banReason: null,
                    banExpires: null,
                }
            });
        })
    }
}
