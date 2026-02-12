import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BanService {
    constructor(private prisma: PrismaService) { }

    async banUser(adminId: string, userId: string, reason: string, days?: number) {
        const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

        return this.prisma.$transaction(async (tx) => {
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
    }

    async unbanUser(userId: string) {
        return this.prisma.$transaction(async (tx) => {
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
            })
        })
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
