import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private authService: AuthService

  ) {
    const secret = config.get<string>('JWT_ACCESS_TOKEN_SECRET');
    console.log(secret)
    if (!secret) {
      throw new UnauthorizedException('JWT_ACCESS_TOKEN_SECRET not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: any) {
    console.log('[JWT Validate] payload:', payload);
    const userId = payload.sub;
    return this.authService.validateJwtUser(userId);
  }
}