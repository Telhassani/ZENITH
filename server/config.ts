import { z } from 'zod'

const envSchema = z.object({
  OPENCLAW_GATEWAY_URL: z.string().url().default('ws://127.0.0.1:18789'),
  OPENCLAW_GATEWAY_TOKEN: z.string().min(1).default('NM7YyJl8ohC7TKLlZhUnbqEfS0Fk3FrN'),
  PKOS_MCP_URL: z.string().url().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  X_API_KEY: z.string().optional(),
  X_API_SECRET: z.string().optional(),
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('Invalid environment variables:')
    console.error(parsed.error.format())
    process.exit(1)
  }
  return parsed.data
}

export const env = loadEnv()
