import { Injectable } from '@nestjs/common';
import { TypeNotification } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async sendNotification(userId: string, title: string, body: string, type: TypeNotification, data?: any) {

        const notification = await this.prisma.notification.create({
            data: {
                userId,
                title,
                body,
                type,
                data: data || {},
            }
        });

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (user?.fcmToken) {
            console.log('Sending notification to user:', user.id, ' - body:', body, ' - title:', title);
        }
        return notification;
    }

    async findAllNotifications(userId: string) {
        return this.prisma.notification.findMany({
            where: {
                userId: userId,
            },
            orderBy: {
                createdAt: 'desc',
            }
        });
    }

    async markAsRead(notificationId: string) {
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }
}
