import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export class CreateUserDto {
    @IsString()
    @MinLength(3, { message: 'Никнейм слишком короткий' })
    nickname: string;

    @IsEmail({}, { message: 'Некорректный Email' })
    email: string;

    @IsString()
    @MinLength(6, { message: 'Пароль должен быть минимум 6 символов' })
    password: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsEnum(['USER', 'MANAGER', 'ADMIN'])
    role?: 'USER' | 'MANAGER' | 'ADMIN';
}
