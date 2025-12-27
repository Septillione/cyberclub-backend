import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private config: ConfigService,
    ) { }

    // Генерация пары токенов
    async getTokens(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role: role };

        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.config.get<string>('AT_SECRET'),
                expiresIn: '15m',
            }),

            this.jwtService.signAsync(payload, {
                secret: this.config.get<string>('RT_SECRET'),
                expiresIn: '7d',
            }),
        ]);

        return {
            accessToken: at,
            refreshToken: rt,
        };
    }

    // Обновление хеша RT в БД
    async updateRtHash(userId: string, rt: string) {
        const hash = await bcrypt.hash(rt, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRt: hash }
        })
    }

    // Вход пользователя
    async signIn(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Неверный email или пароль');
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException('Неверный email или пароль');
        }

        const tokens = await this.getTokens(user.id, user.email, user.role);

        await this.updateRtHash(user.id, tokens.refreshToken);

        return {
            ...tokens,
            user: {
                id: user.id,
                nickname: user.nickname,
                email: user.email,
                avatarUrl: user.avatarUrl,
            }
        };
    }

    // Регистрация пользователя
    async signUp(createUserDto: CreateUserDto) {
        const newUser = await this.usersService.create(createUserDto);

        const tokens = await this.getTokens(newUser.id, newUser.email, newUser.role);

        await this.updateRtHash(newUser.id, tokens.refreshToken);

        return {
            ...tokens,
            user: {
                id: newUser.id,
                nickname: newUser.nickname,
                email: newUser.email,
                avatarUrl: newUser.avatarUrl,
            }
        }
    }

    // Выход пользователя
    async logout(userId: string) {
        await this.prisma.user.updateMany({
            where: { id: userId, hashedRt: { not: null } },
            data: { hashedRt: null },
        });
        return { message: 'Вы успешно вышли' };
    }

    // Обновление токенов
    async refreshTokens(refreshToken: string) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.config.get<string>('RT_SECRET'),
            });

            const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
            if (!user || !user.hashedRt) throw new ForbiddenException('Доступ запрещен');

            const rtMatches = await bcrypt.compare(refreshToken, user.hashedRt);
            if (!rtMatches) throw new ForbiddenException('Доступ запрещен');

            const tokens = await this.getTokens(user.id, user.email, user.role);

            await this.updateRtHash(user.id, tokens.refreshToken);

            return tokens;
        } catch (e) {
            throw new ForbiddenException('Невалидный Refresh Token');
        }
    }
}
