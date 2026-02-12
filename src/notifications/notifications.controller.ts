import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { TokenExpiredError } from '@nestjs/jwt';
import { AtGuard } from 'src/auth/guards/at.guard';
import { BanGuard } from 'src/ban/guard/ban.guard';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @UseGuards(AtGuard)
    @Get()
    findAll(@Req() req) {
        const userId = req.user['sub'];
        return this.notificationsService.findAllNotifications(userId);
    }

    @UseGuards(AtGuard)
    @Patch(':id/read')
    markAsRead(@Param('id') notificationId: string) {
        return this.notificationsService.markAsRead(notificationId);
    }

    @UseGuards(AtGuard)
    @Post('token')
    async saveToken(@Req() req, @Body('token') token: string) {
        return { message: 'Token saved' };
    }
}
