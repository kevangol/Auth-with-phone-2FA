import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorService {
  // Generate a secret for 2FA
  async generateTwoFactorSecret(phoneNumber: string) {
    const secret = authenticator.generateSecret();
    const appName = 'YourAppName';

    const otpAuthUrl = authenticator.keyuri(phoneNumber, appName, secret);
    const qrCodeDataURL = await qrcode.toDataURL(otpAuthUrl);

    return {
      secret,
      qrCodeDataURL,
    };
  }

  // Verify TOTP code
  verifyTwoFactorCode(code: string, secret: string) {
    return authenticator.verify({
      token: code,
      secret,
    });
  }
}
