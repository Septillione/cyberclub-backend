import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AtGuard } from 'src/auth/guards/at.guard';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('admin')
@UseGuards(AtGuard)
@Roles('ADMIN')
export class AdminController {
    constructor(private prisma: PrismaService) { }

    @Patch('users/:id/role')
    async changeUserRole(@Param('id') userId: string, @Body('role') role: 'USER' | 'MANAGER' | 'ADMIN') {
        return this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                role
            }
        });
    }

    @Patch('users/:id/ban')
    async banUser(@Param('id') userId: string, @Body('isBanned') isBanned: boolean) {
        return this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                isBanned
            }
        });
    }

    @Patch('teams/:id/ban')
    async banTeam(@Param('id') teamId: string, @Body('isBanned') isBanned: boolean) {
        return this.prisma.team.update({
            where: {
                id: teamId
            },
            data: {
                isBanned
            }
        });
    }
}
