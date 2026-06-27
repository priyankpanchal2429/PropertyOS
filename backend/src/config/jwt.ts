import dotenv from 'dotenv';
dotenv.config();

export const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'default_access_secret_key_123',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key_456',
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
};
