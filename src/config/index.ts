import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  // Claude
  ANTHROPIC_API_KEY: z.string().min(1),
  AGENT_MODEL: z.string().default('claude-sonnet-4-5-20250929'),
  AGENT_MAX_TOKENS: z.coerce.number().default(8192),

  // Google Ads
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().min(1),
  GOOGLE_ADS_CLIENT_ID: z.string().min(1),
  GOOGLE_ADS_CLIENT_SECRET: z.string().min(1),
  GOOGLE_ADS_REFRESH_TOKEN: z.string().min(1),
  GOOGLE_ADS_LOGIN_CUSTOMER_ID: z.string().min(1),
  GOOGLE_ADS_DEFAULT_CUSTOMER_ID: z.string().min(1),

  // DataForSEO (optional)
  DATAFORSEO_LOGIN: z.string().optional(),
  DATAFORSEO_PASSWORD: z.string().optional(),

  // Notifications (optional)
  SLACK_WEBHOOK_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);

export const GOOGLE_ADS_CONFIG = {
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  customer_id: env.GOOGLE_ADS_DEFAULT_CUSTOMER_ID,
};

export const DATAFORSEO_CONFIG = {
  login: env.DATAFORSEO_LOGIN,
  password: env.DATAFORSEO_PASSWORD,
  baseUrl: 'https://api.dataforseo.com/v3',
};
