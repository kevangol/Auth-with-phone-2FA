import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class Enable2faDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d{6}$/, {
    message: 'TOTP code must be exactly 6 digits',
  })
  twoFactorCode: string;
}
