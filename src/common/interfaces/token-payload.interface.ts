export interface TokenPayload {
  sub: string;
  phoneNumber: string;
  isTwoFactorAuthenticated?: boolean;
}
