import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(sourceDirectory, '../../../.env') });
// Also attempt local server/.env fallback if present
dotenv.config({ path: path.resolve(sourceDirectory, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().optional(),
  GEMINI_TEXT_MODEL: z.string().optional(),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(25000),
  SESSION_SECRET: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim().length < 32) {
        return 'super_secret_session_key_for_ai_mystery_room_production_minimum_32_characters_long';
      }
      return val.trim();
    }),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  GEMINI_MODEL: parsed.GEMINI_MODEL || parsed.GEMINI_TEXT_MODEL || 'gemini-3.5-flash-lite',
};

export type AppEnv = typeof env;
