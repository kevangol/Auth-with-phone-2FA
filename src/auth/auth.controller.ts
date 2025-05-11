import { Controller, Post, Body, Res, UseGuards, Get } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { PhoneLoginDto } from './dto/phone-login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Enable2faDto } from './dto/enable-2fa.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Jwt2faAuthGuard } from './guards/jwt-2fa-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('phone-login')
  async initiatePhoneLogin(@Body() phoneLoginDto: PhoneLoginDto) {
    return this.authService.initiatePhoneLogin(phoneLoginDto.phoneNumber);
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.verifyOtpAndLogin(
      verifyOtpDto.phoneNumber,
      verifyOtpDto.otpCode,
      res,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('2fa/generate')
  async generateTwoFactorSecret(
    @GetUser('id') userId: string,
    @GetUser('phoneNumber') phoneNumber: string,
  ) {
    return this.authService.generateTwoFactorSecret(userId, phoneNumber);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  async enableTwoFactorAuth(
    @GetUser('id') userId: string,
    @Body() enable2faDto: Enable2faDto,
  ) {
    return this.authService.enableTwoFactorAuth(
      userId,
      enable2faDto.twoFactorCode,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  async verifyTwoFactorAuth(
    @GetUser('id') userId: string,
    @GetUser('phoneNumber') phoneNumber: string,
    @Body() enable2faDto: Enable2faDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.verifyTwoFactorAuth(
      userId,
      phoneNumber,
      enable2faDto.twoFactorCode,
      res,
    );
  }

  @UseGuards(Jwt2faAuthGuard)
  @Get('profile')
  getProfile(@GetUser() user) {
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      twoFactorEnabled: user.twoFactorAuth,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }
}
