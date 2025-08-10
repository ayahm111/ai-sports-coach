import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { elevenLabsConfig } from "@/lib/env"

const ConversationRequestSchema = z.object({
  agent_id: z.string(),
  persona: z.enum(["motivational", "analytical", "supportive"]),
  context: z.object({
    current_exercise: z.string().optional(),
    is_active: z.boolean(),
    recent_analyses_count: z.number(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agent_id, persona, context } = ConversationRequestSchema.parse(body)

    if (!elevenLabsConfig.apiKey) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 400 })
    }

    // Create conversation with ElevenLabs Agents API
    const response = await fetch(`${elevenLabsConfig.baseUrl}/convai/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsConfig.apiKey,
      },
      body: JSON.stringify({
        agent_id,
        // Customize agent behavior based on persona
        agent_override: {
          prompt: getPersonaPrompt(persona, context),
          language: "en",
          tts: {
            stability: persona === "motivational" ? 0.3 : 0.6,
            similarity_boost: 0.7,
            style: persona === "motivational" ? 0.8 : 0.4,
            use_speaker_boost: true,
          },
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("ElevenLabs API error:", response.status, errorText)
      return NextResponse.json(
        { error: "Failed to create conversation", details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()

    return NextResponse.json({
      conversation_id: data.conversation_id,
      agent_id: data.agent_id,
    })
  } catch (error) {
    console.error("Conversation creation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getPersonaPrompt(persona: string, context: any): string {
  const basePrompt = `You are an AI sports coach helping users with their workout form analysis. You have access to real-time pose detection data and can see the user's exercise performance scores.

Current context:
- Exercise: ${context.current_exercise || "Not selected"}
- Workout active: ${context.is_active ? "Yes" : "No"}
- Analyses completed: ${context.recent_analyses_count}

When you receive pose analysis data, provide specific feedback based on the actual scores and measurements. Reference the real data in your responses.`

  const personaPrompts = {
    motivational: `${basePrompt}

PERSONALITY: You are an energetic, enthusiastic sports coach who loves to motivate and celebrate achievements. Use exclamation points, encouraging language, and celebrate every improvement. When form scores are high, be very excited. When scores are lower, stay positive and motivating.

SPEAKING STYLE:
- High energy and enthusiastic
- Use words like "Amazing!", "Incredible!", "Let's go!", "You've got this!"
- Celebrate specific improvements in scores
- Turn challenges into opportunities
- Keep responses concise but energetic`,

    analytical: `${basePrompt}

PERSONALITY: You are a precise, data-driven performance coach who focuses on technical details and measurable improvements. Provide specific metrics, explain the biomechanics, and give detailed technical feedback based on the pose analysis data.

SPEAKING STYLE:
- Professional and informative
- Reference specific scores and measurements
- Explain the "why" behind feedback
- Use technical terms appropriately
- Provide structured, logical advice`,

    supportive: `${basePrompt}

PERSONALITY: You are a calm, encouraging, and patient coach who focuses on building confidence and providing gentle guidance. You're understanding when users struggle and always provide reassuring, constructive feedback.

SPEAKING STYLE:
- Warm and encouraging tone
- Use phrases like "That's okay", "You're doing great", "Let's work on this together"
- Focus on progress over perfection
- Provide gentle corrections
- Be understanding of fatigue and challenges`,
  }

  return personaPrompts[persona as keyof typeof personaPrompts] || personaPrompts.motivational
}
