// import { AuthGuard } from "@nestjs/passport";

// export class AtGuard extends AuthGuard('jwt') { }


import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AtGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        // Ищем декоратор @Public на методе или классе
        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);

        // Если роут помечен как Public - разрешаем доступ без проверки токена
        if (isPublic) {
            return true;
        }

        // Иначе выполняем стандартную проверку JWT
        return super.canActivate(context);
    }
}
