import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { OtpService } from '../otp/otp.service';
import { TwoFactorService } from '../two-factor/two-factor.service';
import { TokenPayload } from '../common/interfaces/token-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private otpService: OtpService,
    private twoFactorService: TwoFactorService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Initiate phone login/signup flow
  async initiatePhoneLogin(phoneNumber: string) {
    // Check if user exists
    const user = await this.usersService.findOneByPhone(phoneNumber);

    // Generate OTP regardless of whether user exists or not
    const otp = await this.otpService.createOtp(phoneNumber);

    // In a real application, send the OTP via SMS

    return {
      message: 'OTP sent successfully',
      isNewUser: !user,
    };
  }

  // Verify OTP and login/signup user
  async verifyOtpAndLogin(phoneNumber: string, otpCode: string, res: Response) {
    // Verify OTP
    const isValid = await this.otpService.verifyOtp(phoneNumber, otpCode);

    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Find or create user
    let user = await this.usersService.findOneByPhone(phoneNumber);

    if (!user) {
      // Create new user if doesn't exist
      user = await this.usersService.create(phoneNumber);
    }

    // Generate JWT token
    const payload: TokenPayload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
    };

    if (user.twoFactorAuth) {
      // If 2FA is enabled, return partial authentication
      const token = this.jwtService.sign(payload);
      this.setCookie(res, token);

      return {
        message: 'OTP verification successful',
        requiresTwoFactor: true,
      };
    } else {
      // If 2FA is not enabled, return full authentication
      const payload: TokenPayload = {
        sub: user.id,
        phoneNumber: user.phoneNumber,
        isTwoFactorAuthenticated: true,
      };

      const token = this.jwtService.sign(payload);
      this.setCookie(res, token);

      return {
        message: 'Authentication successful',
        userId: user.id,
      };
    }
  }

  // Generate 2FA secret and QR code
  async generateTwoFactorSecret(userId: string, phoneNumber: string) {
    const { secret, qrCodeDataURL } =
      await this.twoFactorService.generateTwoFactorSecret(phoneNumber);

    // Save secret to user
    await this.usersService.setTwoFactorAuthenticationSecret(userId, secret);

    return {
      qrCodeDataURL,
    };
  }

  // Enable 2FA after verifying TOTP code
  async enableTwoFactorAuth(userId: string, twoFactorCode: string) {
    const user = await this.usersService.findOneById(userId);

    if (!user?.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not set up');
    }

    const isValid = this.twoFactorService.verifyTwoFactorCode(
      twoFactorCode,
      user.twoFactorSecret,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid authentication code');
    }

    await this.usersService.enableTwoFactorAuth(userId);

    return {
      message: 'Two-factor authentication enabled successfully',
    };
  }

  // Verify 2FA code during login
  async verifyTwoFactorAuth(
    userId: string,
    phoneNumber: string,
    twoFactorCode: string,
    res: Response,
  ) {
    const user = await this.usersService.findOneByPhone(phoneNumber);

    if (!user?.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not set up');
    }

    const isValid = this.twoFactorService.verifyTwoFactorCode(
      twoFactorCode,
      user.twoFactorSecret,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid authentication code');
    }

    // Generate JWT with 2FA flag
    const payload: TokenPayload = {
      sub: userId,
      phoneNumber,
      isTwoFactorAuthenticated: true,
    };

    const token = this.jwtService.sign(payload);
    this.setCookie(res, token);

    return {
      message: 'Two-factor authentication successful',
      userId,
    };
  }

  // Log out
  async logout(res: Response) {
    res.clearCookie('Authentication');
    return { message: 'Logged out successfully' };
  }

  // Helper to set secure cookie
  private setCookie(res: Response, token: string) {
    const cookieOptions = {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict' as const,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    };

    res.cookie('Authentication', token, cookieOptions);
  }
}
