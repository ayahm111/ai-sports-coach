import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";

const SpeechRequestSchema = z.object({
  text: z.string().min(1).max(1000),
  persona: z.enum(["motivational", "analytical", "supportive"]).optional().default("motivational"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, persona } = SpeechRequestSchema.parse(body);

    const voiceIds = {
      motivational: env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID_MOTIVATIONAL,
      analytical: env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID_ANALYTICAL,
      supportive: env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID_SUPPORTIVE,
    };

    const voiceId = voiceIds[persona] || env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID_DEFAULT;

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Speech synthesis error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}