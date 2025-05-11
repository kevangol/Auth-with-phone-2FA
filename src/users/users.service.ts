import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOneById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async findOneByPhone(phoneNumber: string) {
    return this.prisma.user.findUnique({
      where: { phoneNumber },
    });
  }

  async create(phoneNumber: string) {
    return this.prisma.user.create({
      data: { phoneNumber },
    });
  }

  async setTwoFactorAuthenticationSecret(userId: string, secret: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });
  }

  async enableTwoFactorAuth(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorAuth: true },
    });
  }
}
