// src/auth/auth.controller.ts
import {
    Controller,
    Post,
    Body,
    Res,
    Req,
    UseGuards,
    ValidationPipe,
    UsePipes,
    Get,
    UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async register(@Body() dto: CreateUserDto, @Res({ passthrough: true }) res: Response) {
        const { user } = await this.authService.register(dto);
        // this.setRefreshCookie(res, refreshToken);
        return { user };
    }

    @Post('login')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, refreshToken, user } = await this.authService.login(dto.email, dto.password);
        this.setRefreshCookie(res, refreshToken);
        return { user, accessToken };
    }

    @Post('refresh')
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        console.log('[auth/refresh] cookies:', req.cookies); // debug
        const token = req.cookies?.['refreshToken'];
        if (!token) throw new UnauthorizedException('No refresh token');
        const payload: any = await this.authService.verifyRefreshToken(token);
        const newTokens = await this.authService.refreshTokens(payload.sub, token);
        this.setRefreshCookie(res, newTokens.refreshToken);
        return { accessToken: newTokens.accessToken };
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
        await this.authService.logout(req.user.userId);
        console.log(req.user)
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path:'/'
        });
        console.log('headers:', req.headers);
        console.log('cookies:', req.cookies);

        return { message: 'Logged out successfully' };
    }

    
    @UseGuards(JwtAuthGuard)
    @Get('protected')
    protected(){
        console.log("You can access protected route")
    }

    private setRefreshCookie(res: Response, token: string) {
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none': 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }
}
