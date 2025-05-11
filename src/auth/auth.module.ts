import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { OtpModule } from '../otp/otp.module';
import { TwoFactorModule } from '../two-factor/two-factor.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Jwt2faStrategy } from './strategies/jwt-2fa.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION_TIME', '7d'),
        },
      }),
    }),
    UsersModule,
    OtpModule,
    TwoFactorModule,
  ],
  providers: [AuthService, JwtStrategy, Jwt2faStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
