import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenPayload } from '../../common/interfaces/token-payload.interface';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.Authentication;
        },
      ]),
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: TokenPayload) {
    const user = await this.usersService.findOneByPhone(payload.phoneNumber);

    if (user?.twoFactorAuth && !payload.isTwoFactorAuthenticated) {
      // If 2FA is enabled but not authenticated, return partial user
      return {
        id: user.id,
        phoneNumber: user.phoneNumber,
        requiresTwoFactor: true,
      };
    }

    return user;
  }
}
