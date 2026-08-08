import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5005,
  jwtSecret: process.env.JWT_SECRET || 'bangar_bhavan_chats_secure_jwt_secret_2026',
  jwtExpiresIn: '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
