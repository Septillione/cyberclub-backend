export class CreateUserDto {
    nickname: string;
    email: string;
    password: string;
    bio?: string;
    role?: 'USER' | 'MANAGER' | 'ADMIN';
}
