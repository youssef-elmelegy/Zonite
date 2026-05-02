import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    // Core
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),

    // Database
    DATABASE_URL: z
      .string()
      .refine((v) => v.startsWith('postgresql://') || v.startsWith('postgres://'), {
        message: 'DATABASE_URL must start with postgresql:// or postgres://',
      }),

    // CORS
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:5173')
      .transform((s) =>
        s
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean),
      ),

    // JWT
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRES_IN: z.coerce.number().int().positive().default(900),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_REFRESH_EXPIRES_IN: z.coerce.number().int().positive().default(604800),
    JWT_RESET_PASSWORD_EXPIRES_IN: z.coerce.number().int().positive().default(3600),
    JWT_SETUP_PROFILE_EXPIRES_IN: z.coerce.number().default(10 * 60), // 10 minutes in seconds

    // Cookies
    COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters'),

    // Bcrypt
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

    // Throttler
    THROTTLE_GLOBAL_TTL: z.coerce.number().int().positive().default(60),
    THROTTLE_GLOBAL_LIMIT: z.coerce.number().int().positive().default(100),
    THROTTLE_AUTH_TTL: z.coerce.number().int().positive().default(60),
    THROTTLE_AUTH_LIMIT: z.coerce.number().int().positive().default(5),

    // Email / SMTP
    SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
    SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
    MAIL_FROM_NAME: z.string().min(1, 'MAIL_FROM_NAME is required'),
    MAIL_FROM: z.string().min(1, 'MAIL_FROM is required'),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
    CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
    CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

    // YalGamers
    YALGAMERS_API_KEY: z.string().min(1, 'YALGAMERS_API_KEY is required'),

    // Client URL
    CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL').default('http://localhost:5173'),
  })
  .superRefine((data, ctx) => {
    // Validate auth throttler is stricter than global
    if (data.THROTTLE_AUTH_LIMIT >= data.THROTTLE_GLOBAL_LIMIT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['THROTTLE_AUTH_LIMIT'],
        message: 'THROTTLE_AUTH_LIMIT must be less than THROTTLE_GLOBAL_LIMIT',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[startup] env validation failed:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
export type Env = typeof env;
