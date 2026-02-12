import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class TeamBanGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Пытаемся найти teamId в теле запроса (POST) или в параметрах (GET/DELETE)
        const teamId = request.body.teamId || request.params.teamId;

        // Если действие не связано с командой (нет teamId), пропускаем проверку
        if (!teamId) return true;

        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
            select: { isBanned: true, banReason: true, banExpires: true, name: true }
        });

        if (!team) {
            // Опционально: можно кидать ошибку, если команды нет, 
            // но лучше оставить это контроллеру/сервису.
            return true;
        }

        if (team.isBanned) {
            let message = `Команда "${team.name}" заблокирована. Причина: ${team.banReason}`;
            if (team.banExpires) {
                message += `. Истекает: ${team.banExpires.toLocaleDateString()}`;
            } else {
                message += `. (Перманентно)`;
            }

            throw new ForbiddenException(message);
        }

        return true;
    }
}