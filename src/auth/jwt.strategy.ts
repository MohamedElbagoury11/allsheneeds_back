import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const rawSecret = configService.get<string>('JWT_SECRET');
    const secret = rawSecret || 'temporary-fallback-secret-for-deployment';
    
    if (!rawSecret) {
      console.error('\n❌ WARNING: JWT_SECRET environment variable is missing! Using a temporary fallback secret. Please set JWT_SECRET on your server as soon as possible.\n');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
