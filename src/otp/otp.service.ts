// src/otp/otp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private prisma: PrismaService) {}

  async createOtp(phoneNumber: string): Promise<any> {
    try {
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

      // Set expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

      // Notice we're using 'oTP' (camelCase) which matches how Prisma generates the client
      // Create new OTP
      const newOtp = await this.prisma.oTP.create({
        data: {
          phoneNumber,
          code: otp, // Changed from 'otp' to 'code' to match your schema
          expiresAt,
        },
      });

      return {
        id: newOtp.id,
        phoneNumber: newOtp.phoneNumber,
        expiresAt: newOtp.expiresAt,
        // Don't return the actual OTP code in the response for security
      };
    } catch (error) {
      this.logger.error(`Error creating OTP: ${error.message}`, error.stack);
      throw error;
    }
  }

  async verifyOtp(phoneNumber: string, otpCode: string): Promise<boolean> {
    try {
      // Find the most recent OTP for this phone number
      const otpRecord = await this.prisma.oTP.findFirst({
        where: {
          phoneNumber,
          code: otpCode, // Changed from 'otp' to 'code' to match your schema
          expiresAt: { gt: new Date() }, // Only check non-expired OTPs
        },
        orderBy: { createdAt: 'desc' },
      });

      // If no valid OTP found, return false
      if (!otpRecord) {
        return false;
      }

      // Optional: Delete the OTP after verification to prevent reuse
      try {
        await this.prisma.oTP.delete({
          where: { id: otpRecord.id },
        });
      } catch (deleteError) {
        this.logger.warn(`Failed to delete used OTP: ${deleteError.message}`);
        // Continue execution even if delete fails
      }

      // OTP is valid
      return true;
    } catch (error) {
      this.logger.error(`Error verifying OTP: ${error.message}`, error.stack);
      return false;
    }
  }
}
