import { z } from "zod"

const envSchema = z.object({
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_AGENT_ID: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse({
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  ELEVENLABS_AGENT_ID: process.env.ELEVENLABS_AGENT_ID,
  NODE_ENV: process.env.NODE_ENV,
})

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format())
  throw new Error("Invalid environment variables")
}

export const env = parsedEnv.data

// Check if we're in mock mode
export const isMockMode = !env.ELEVENLABS_API_KEY || !env.ELEVENLABS_AGENT_ID

// ElevenLabs configuration with validation
export const elevenLabsConfig = {
  apiKey: env.ELEVENLABS_API_KEY,
  agentId: env.ELEVENLABS_AGENT_ID,
  baseUrl: "https://api.elevenlabs.io/v1",
  wsUrl: "wss://api.elevenlabs.io/v1/convai/conversation",
  isConfigured: !!(env.ELEVENLABS_API_KEY && env.ELEVENLABS_AGENT_ID),
  isValidApiKey: env.ELEVENLABS_API_KEY ? env.ELEVENLABS_API_KEY.startsWith("sk_") : false,
}

// Log configuration status (without exposing sensitive data)
if (typeof window === "undefined") {
  // Only log on server side
  console.log("🔧 Environment Configuration:")
  console.log(`   NODE_ENV: ${env.NODE_ENV}`)
  console.log(`   ElevenLabs API Key: ${env.ELEVENLABS_API_KEY ? "✅ Present" : "❌ Missing"}`)
  console.log(`   ElevenLabs Agent ID: ${env.ELEVENLABS_AGENT_ID ? "✅ Present" : "❌ Missing"}`)
  console.log(`   API Key Format Valid: ${elevenLabsConfig.isValidApiKey ? "✅ Yes" : "❌ No"}`)
  console.log(`   Mock Mode: ${isMockMode ? "✅ Active" : "❌ Disabled"}`)
}
