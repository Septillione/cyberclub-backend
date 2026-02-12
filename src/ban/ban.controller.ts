import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AtGuard } from 'src/auth/guards/at.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateBanTeamDto, CreateBanUserDto } from './dto/create-ban.dto';
import { BanService } from './ban.service';

@Controller('ban')
@UseGuards(AtGuard, RolesGuard)
@Roles('ADMIN')
export class BanController {
    constructor(private readonly banService: BanService, private prisma: PrismaService) { }

    @Post('user')
    async banUser(@Req() req, @Body() dto: CreateBanUserDto) {
        const userId = req.user['sub'];
        return this.banService.banUser(
            userId,
            dto.userId,
            dto.reason,
            dto.days
        )
    }

    @Post('unban/user/:userId')
    async unbanUser(@Param('userId') userId: string) {
        return this.banService.unbanUser(userId);
    }

    @Post('team')
    async banTeam(@Req() req, @Body() dto: CreateBanTeamDto) {
        const userId = req.user['sub'];
        return this.banService.banTeam(
            userId,
            dto.teamId,
            dto.reason,
            dto.days
        )
    }

    @Post('unban/team/:teamId')
    async unbanTeam(@Param('teamId') teamId: string) {
        return this.banService.unbanTeam(teamId);
    }

    // @Cron(CronExpression.EVERY_HOUR)
    // async handleCron() {
    //     const now = new Date();

    //     const expiredUsers = await this.prisma.user.findMany({
    //         where: {
    //             isBanned: true,
    //             banExpires: { lte: now }
    //         }
    //     });

    //     for (const user of expiredUsers) {
    //         console.log(`Auto-unbanning user ${user.nickname}`);

    //         await this.prisma.user.update({
    //             where: { id: user.id },
    //             data: { isBanned: false, banReason: null, banExpires: null }
    //         });

    //         await this.prisma.banHistory.updateMany({
    //             where: { userId: user.id, isActive: true },
    //             data: { isActive: false }
    //         });
    //     }
    // }

    @Cron(CronExpression.EVERY_HOUR)
    async handleCron() {
        const now = new Date();

        // 1. Логика разбана ЮЗЕРОВ (ваша текущая)
        const expiredUsers = await this.prisma.user.findMany({
            where: { isBanned: true, banExpires: { lte: now } }
        });

        for (const user of expiredUsers) {
            console.log(`Auto-unbanning user ${user.nickname}`);
            await this.prisma.$transaction([
                this.prisma.user.update({
                    where: { id: user.id },
                    data: { isBanned: false, banReason: null, banExpires: null }
                }),
                this.prisma.banHistory.updateMany({
                    where: { userId: user.id, isActive: true },
                    data: { isActive: false }
                })
            ]);
        }

        // 2. Логика разбана КОМАНД (новая)
        const expiredTeams = await this.prisma.team.findMany({
            where: { isBanned: true, banExpires: { lte: now } }
        });

        for (const team of expiredTeams) {
            console.log(`Auto-unbanning team ${team.name}`);
            await this.prisma.$transaction([
                this.prisma.team.update({
                    where: { id: team.id },
                    data: { isBanned: false, banReason: null, banExpires: null }
                }),
                this.prisma.banHistory.updateMany({
                    where: { teamId: team.id, isActive: true },
                    data: { isActive: false }
                })
            ]);
        }
    }
}
