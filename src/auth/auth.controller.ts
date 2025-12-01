import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { AtGuard } from './guards/at.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    signUp(@Body() dto: CreateUserDto) {
        return this.authService.signUp(dto);
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    signIn(@Body() dto: Record<string, any>) {
        return this.authService.signIn(dto.email, dto.password);
    }

    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    refresh(@Body() body: { refreshToken: string }) {
        return this.authService.refreshTokens(body.refreshToken);
    }

    @UseGuards(AtGuard)
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    logout(@Req() req: any) {
        const userId = req.user['sub'];
        return this.authService.logout(userId);
    }

    @UseGuards(AtGuard)
    @Get('profile')
    getProfile(@Req() req) {
        return req.user;
    }

    @UseGuards(AtGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('admin-only')
    onlyAdmin() {
        return 'This is admin only';
    }

    @UseGuards(AtGuard, RolesGuard)
    @Roles('MANAGER', 'ADMIN')
    @Get('manager-area')
    managerArea() {
        return 'Manager area';
    }
}
