// import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
// import { Reflector } from "@nestjs/core";
// import { PrismaService } from "src/prisma/prisma.service";

// @Injectable()
// export class BanGuard implements CanActivate {
//     constructor(private prisma: PrismaService, private reflector: Reflector) { }

//     async canActivate(context: ExecutionContext): Promise<boolean> {
//         const request = context.switchToHttp().getRequest();
//         const userId = request.user?.id; // Предполагаем, что AuthGuard уже отработал

//         if (!userId) return true; // Если роут публичный, пропускаем

//         // Проверяем статус в БД
//         // (Для оптимизации можно хранить статус бана в Redis, чтобы не дергать БД каждый раз)
//         const user = await this.prisma.user.findUnique({
//             where: { id: userId },
//             select: { isBanned: true, banReason: true, banExpires: true }
//         });

//         if (user && user.isBanned) {
//             // Формируем красивое сообщение об ошибке
//             let message = `Ваш аккаунт заблокирован. Причина: ${user.banReason}`;
//             if (user.banExpires) {
//                 message += `. Истекает: ${user.banExpires.toLocaleDateString()}`;
//             } else {
//                 message += `. (Перманентно)`;
//             }

//             throw new ForbiddenException(message);
//         }

//         return true;
//     }
// }



import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class BanGuard implements CanActivate {
    constructor(
        private prisma: PrismaService,
        private reflector: Reflector
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 1. Пропускаем публичные роуты (Логин/Регистрация)
        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();

        // Пытаемся получить ID (sub - стандартное поле из JWT payload)
        const userId = request.user?.sub || request.user?.id;

        // Если userId нет (например, токен невалиден, но это должен ловить AtGuard), пропускаем
        if (!userId) return true;

        // 2. Проверяем статус в БД
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { isBanned: true, banReason: true, banExpires: true }
        });

        if (user && user.isBanned) {
            let message = `Ваш аккаунт заблокирован. Причина: ${user.banReason}`;
            if (user.banExpires) {
                message += `. Истекает: ${user.banExpires.toLocaleDateString()}`;
            } else {
                message += `. (Перманентно)`;
            }

            throw new ForbiddenException(message);
        }

        return true;
    }
}




// import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
// import { Reflector } from "@nestjs/core"; // Импортируем Reflector
// import { PrismaService } from "src/prisma/prisma.service";

// @Injectable()
// export class BanGuard implements CanActivate {
//     constructor(
//         private prisma: PrismaService,
//         private reflector: Reflector // Для проверки метаданных Public
//     ) { }

//     async canActivate(context: ExecutionContext): Promise<boolean> {
//         // 1. Проверяем, является ли роут публичным (isPublic)
//         // Если вы используете декоратор @Public() как в стандартных гайдах NestJS
//         const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
//             context.getHandler(),
//             context.getClass(),
//         ]);
//         if (isPublic) return true;

//         const request = context.switchToHttp().getRequest();
//         const userId = request.user?.sub || request.user?.id;

//         // Если userId нет (например, AuthGuard почему-то пропустил, но это не Public),
//         // лучше вернуть true или false в зависимости от логики.
//         // Обычно, если нет ID, то банить некого.
//         if (!userId) return true;

//         // 2. Проверяем статус в БД
//         const user = await this.prisma.user.findUnique({
//             where: { id: userId },
//             select: { isBanned: true, banReason: true, banExpires: true }
//         });

//         if (user && user.isBanned) {
//             let message = `Ваш аккаунт заблокирован. Причина: ${user.banReason}`;
//             if (user.banExpires) {
//                 message += `. Истекает: ${user.banExpires.toLocaleDateString()}`;
//             } else {
//                 message += `. (Перманентно)`;
//             }

//             throw new ForbiddenException({
//                 message: message,
//                 error: "Forbidden",
//                 statusCode: 403
//             });
//         }

//         return true;
//     }
// }
