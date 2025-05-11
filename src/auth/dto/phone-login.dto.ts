import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class PhoneLoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +1234567890)',
  })
  phoneNumber: string;
}
