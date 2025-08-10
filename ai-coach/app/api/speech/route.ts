import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { env } from "@/lib/env"

const SpeechRequestSchema = z.object({
  text: z.string().min(1).max(1000),
  persona: z.enum(["motivational", "analytical", "supportive"]).optional().default("motivational"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, persona } = SpeechRequestSchema.parse(body)

    // Check if ElevenLabs API key is available and properly formatted
    if (!env.ELEVENLABS_API_KEY) {
      console.log("ElevenLabs API key not found, using mock audio")
      return generateMockAudio(text, persona)
    }

    // Validate API key format
    if (!env.ELEVENLABS_API_KEY.startsWith("sk_")) {
      console.log("Invalid ElevenLabs API key format, using mock audio")
      return generateMockAudio(text, persona)
    }

    // Select voice based on persona
    const voiceIds = {
      motivational: "21m00Tcm4TlvDq8ikWAM", // Rachel - Energetic
      analytical: "AZnzlk1XvdvUeBnXmlld", // Thomas - Professional
      supportive: "EXAVITQu4vr4xnSDxMaL", // Sarah - Calm
    }

    const voiceId = voiceIds[persona] || voiceIds.motivational

    console.log(`Attempting ElevenLabs TTS with voice: ${voiceId}`)

    // Use ElevenLabs API for real voice synthesis
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text.slice(0, 500), // Limit text length
        model_id: "eleven_monolingual_v1",
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
      console.error(`ElevenLabs API error: ${response.status} - ${errorText}`)

      // Handle specific error cases
      if (response.status === 401) {
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.detail?.status === "detected_unusual_activity") {
            console.error("ElevenLabs detected unusual activity - Free tier disabled")
            console.log("💡 Try running locally instead of on shared hosting to avoid this issue")
          } else {
            console.error("ElevenLabs API key is invalid or expired")
          }
        } catch {
          console.error("ElevenLabs API authentication failed")
        }
      } else if (response.status === 429) {
        console.error("ElevenLabs API rate limit exceeded")
      } else if (response.status === 422) {
        console.error("ElevenLabs API request validation failed")
      }

      // Fallback to mock audio on any API error
      return generateMockAudio(text, persona)
    }

    const audioBuffer = await response.arrayBuffer()
    console.log(`✅ ElevenLabs TTS successful, audio size: ${audioBuffer.byteLength} bytes`)

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("Speech synthesis error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    // Always fallback to mock audio on any error
    const body = await request.json().catch(() => ({ text: "Speech synthesis unavailable", persona: "motivational" }))
    return generateMockAudio(body.text || "Speech synthesis unavailable", body.persona || "motivational")
  }
}

function generateMockAudio(text: string, persona: string): NextResponse {
  console.log(`Generating mock audio for persona: ${persona}`)

  // Generate persona-specific mock audio characteristics
  const sampleRate = 44100
  const duration = Math.min(Math.max(text.length * 0.08, 1), 8) // Max 8 seconds
  const samples = Math.floor(sampleRate * duration)

  // Create a simple sine wave with persona-specific characteristics
  const buffer = new ArrayBuffer(44 + samples * 2)
  const view = new DataView(buffer)

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(0, "RIFF")
  view.setUint32(4, 36 + samples * 2, true)
  writeString(8, "WAVE")
  writeString(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, "data")
  view.setUint32(40, samples * 2, true)

  // Generate audio data with persona characteristics
  const baseFreq = persona === "motivational" ? 520 : persona === "analytical" ? 440 : 380
  const amplitude = persona === "motivational" ? 0.15 : 0.1

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate
    let sample = 0

    // Add multiple harmonics for more natural sound
    sample += Math.sin(2 * Math.PI * baseFreq * t) * amplitude
    sample += Math.sin(2 * Math.PI * baseFreq * 2 * t) * amplitude * 0.3
    sample += Math.sin(2 * Math.PI * baseFreq * 3 * t) * amplitude * 0.1

    // Add envelope for natural fade in/out
    const envelope = Math.sin((Math.PI * t) / duration)
    sample *= envelope

    view.setInt16(44 + i * 2, sample * 32767, true)
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
