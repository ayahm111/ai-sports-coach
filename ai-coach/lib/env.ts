import { z } from "zod"

const envSchema = z.object({
  ELEVENLABS_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

export const env = envSchema.parse({
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  NODE_ENV: process.env.NODE_ENV,
})

export const isMockMode = !env.ELEVENLABS_API_KEY
