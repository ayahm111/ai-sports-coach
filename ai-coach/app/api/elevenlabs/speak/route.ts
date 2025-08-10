import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { elevenLabsConfig } from "@/lib/env"

const SpeakRequestSchema = z.object({
  text: z.string().min(1).max(1000),
  conversation_id: z.string().optional(),
  persona: z.enum(["motivational", "analytical", "supportive"]).optional().default("motivational"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, conversation_id, persona } = SpeakRequestSchema.parse(body)

    if (!elevenLabsConfig.apiKey || !elevenLabsConfig.isValidApiKey) {
      return NextResponse.json(
        {
          error: "ElevenLabs API key not configured or invalid format",
          details: "API key should start with 'sk_'",
        },
        { status: 400 },
      )
    }

    // Select voice based on persona
    const voiceIds = {
      motivational: "21m00Tcm4TlvDq8ikWAM", // Rachel - Energetic
      analytical: "AZnzlk1XvdvUeBnXmlld", // Thomas - Professional
      supportive: "EXAVITQu4vr4xnSDxMaL", // Sarah - Calm
    }

    const voiceId = voiceIds[persona] || voiceIds.motivational

    console.log(`ElevenLabs TTS request - Voice: ${voiceId}, Text length: ${text.length}`)

    // Use ElevenLabs TTS API
    const response = await fetch(`${elevenLabsConfig.baseUrl}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsConfig.apiKey,
      },
      body: JSON.stringify({
        text: text.slice(0, 500), // Limit text length
        model_id: "eleven_turbo_v2_5", // Use faster model
        voice_settings: {
          stability: persona === "motivational" ? 0.3 : 0.6,
          similarity_boost: 0.7,
          style: persona === "motivational" ? 0.8 : 0.4,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`ElevenLabs TTS error: ${response.status} - ${errorText}`)

      let errorMessage = "Speech synthesis failed"
      if (response.status === 401) {
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.detail?.status === "detected_unusual_activity") {
            errorMessage = "ElevenLabs detected unusual activity - try running locally"
          } else {
            errorMessage = "Invalid ElevenLabs API key"
          }
        } catch {
          errorMessage = "ElevenLabs authentication failed"
        }
      } else if (response.status === 429) {
        errorMessage = "ElevenLabs API rate limit exceeded"
      } else if (response.status === 422) {
        errorMessage = "Invalid request parameters"
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorText,
          status: response.status,
        },
        { status: response.status },
      )
    }

    const audioBuffer = await response.arrayBuffer()
    console.log(`✅ ElevenLabs TTS successful - Audio size: ${audioBuffer.byteLength} bytes`)

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("ElevenLabs TTS error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
