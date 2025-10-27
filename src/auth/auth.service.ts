// src/auth/auth.service.ts
import {
    Injectable,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersService: UsersService,
        private jwtService: JwtService,
        private config: ConfigService,
    ) { }


    private async hash(data: string){
        const rounds = 10
        return await bcrypt.hash(data, rounds)
    }
    
    private async compare(data: string, hash: string) {
        return bcrypt.compare(data, hash);
    }

    async register(createUserDto: CreateUserDto) {
        const exists = await this.usersService.findByEmail(createUserDto?.email);
        if (exists) throw new ForbiddenException('Email already used');
        const user = await this.usersService.create(createUserDto)
        console.log("User ", user);
        return {
            user: user
        }
    }


    async validateLocalUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new UnauthorizedException('User not found!');
        const isPasswordMatched = this.compare(user.password, password);
        if (!isPasswordMatched)
            throw new UnauthorizedException('Invalid Credentials!');

        return { id: user.id, name: user.name, role: user.role };
    }

    async validateJwtUser(userId: number) {
        const user = await this.usersService.findOne(userId);
        if (!user) throw new UnauthorizedException('User not found!');
        const currentUser = { userId: user.id, email: user.email, role: user.role };
        return currentUser;
    }


    async login(email: string, password: string) {
        const user = await this.usersService.findByEmail(email)
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const valid = await this.compare(password, user.password);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        const tokens = await this.getTokens(user);

        const hashedRT = await this.hash(tokens.refreshToken)


        await this.usersService.updateHashedRefreshToken(user.id, hashedRT);
        console.log(`User : ${user.name}`)
        console.log(`Tokens: ${tokens.accessToken}`)

        return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
    }

    async logout(userId: number) {
        console.log("User Logged Out")
        await this.usersService.updateHashedRefreshToken(userId, null);
    }

    async refreshTokens(userId: number, refreshToken: string) {
        const user = await this.usersService.findOne(userId);
        if (!user || !user.refreshTokenHash)
            throw new UnauthorizedException('Unauthorized');

        const matches = await this.compare(refreshToken, user.refreshTokenHash);
        if (!matches) throw new UnauthorizedException('Unauthorized');

        const tokens = await this.getTokens(user);
        const hashedRT = await this.hash(tokens.refreshToken)
        await this.usersService.updateHashedRefreshToken(user.id, hashedRT);
        return tokens;
    }

    async verifyRefreshToken(token: string) {
        return this.jwtService.verifyAsync(token, {
            secret: this.config.get('JWT_REFRESH_TOKEN_SECRET'),
        });
    }

    private async getTokens(user: User) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.config.get('JWT_ACCESS_TOKEN_SECRET'),
            expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
        });
        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.config.get('JWT_REFRESH_TOKEN_SECRET'),
            expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        });
        return { accessToken, refreshToken };
    }

}
