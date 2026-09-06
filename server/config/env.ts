import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'caregrid_jwt_secret_dev_key_2026',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/caregrid',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  ESANJEEVANI_URL: process.env.ESANJEEVANI_GATEWAY_URL || 'https://mock.esanjeevani.gov.in',
  ABDM_SANDBOX: process.env.ABDM_SANDBOX_CLIENT_ID || 'caregrid-abdm-sandbox'
};
