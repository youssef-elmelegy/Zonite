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
    
    // Cookies
    COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters'),
    
    // Bcrypt
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    
    // Throttler
    THROTTLE_GLOBAL_TTL: z.coerce.number().int().positive().default(60),
    THROTTLE_GLOBAL_LIMIT: z.coerce.number().int().positive().default(100),
    THROTTLE_AUTH_TTL: z.coerce.number().int().positive().default(60),
    THROTTLE_AUTH_LIMIT: z.coerce.number().int().positive().default(5),
    
    // Mail
    MAIL_TRANSPORT: z.enum(['console', 'stream', 'smtp']).default('console'),
    MAIL_FROM: z.string().email().default('noreply@zonite.local'),
    MAIL_HOST: z.string().optional(),
    MAIL_PORT: z.coerce.number().int().optional(),
    MAIL_USER: z.string().optional(),
    MAIL_PASS: z.string().optional(),
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
    
    // Validate SMTP config if transport is SMTP
    if (data.MAIL_TRANSPORT === 'smtp') {
      if (!data.MAIL_HOST) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['MAIL_HOST'],
          message: 'MAIL_HOST is required when MAIL_TRANSPORT=smtp',
        });
      }
      if (!data.MAIL_PORT) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['MAIL_PORT'],
          message: 'MAIL_PORT is required when MAIL_TRANSPORT=smtp',
        });
      }
      if (!data.MAIL_USER) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['MAIL_USER'],
          message: 'MAIL_USER is required when MAIL_TRANSPORT=smtp',
        });
      }
      if (!data.MAIL_PASS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['MAIL_PASS'],
          message: 'MAIL_PASS is required when MAIL_TRANSPORT=smtp',
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[startup] env validation failed:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
export type Env = typeof env;

