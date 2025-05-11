import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenPayload } from '../../common/interfaces/token-payload.interface';
import { UsersService } from '../../users/users.service';

@Injectable()
export class Jwt2faStrategy extends PassportStrategy(Strategy, 'jwt-2fa') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const getKey = configService.get('JWT_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.Authentication;
        },
      ]),
      secretOrKey: getKey,
    });
  }

  async validate(payload: TokenPayload) {
    const user = await this.usersService.findOneByPhone(payload.phoneNumber);

    if (user?.twoFactorAuth && !payload.isTwoFactorAuthenticated) {
      return null; // This will trigger unauthorized exception
    }

    return user;
  }
}
