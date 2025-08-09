"use client";

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { AnalysisResult } from "@/lib/types"

interface ConversationalAgentProps {
  isActive: boolean
  currentExercise: string
  analysisResult: AnalysisResult | null
  onMessage: (message: string, type: "feedback" | "motivation" | "instruction") => void
}

interface Message {
  id: string
  content: string
  type: "user" | "agent"
  timestamp: Date
  category?: "feedback" | "motivation" | "instruction" | "question"
}

export default function ConversationalAgent({
  isActive,
  currentExercise,
  analysisResult,
  onMessage,
}: ConversationalAgentProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [agentPersona, setAgentPersona] = useState<"motivational" | "analytical" | "supportive">("motivational")
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize conversational agent
  useEffect(() => {
    if (isActive) {
      initializeAgent()
      addWelcomeMessage()
    }
  }, [isActive])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // React to analysis results
  useEffect(() => {
    if (analysisResult && isActive) {
      generateContextualFeedback(analysisResult)
    }
  }, [analysisResult, isActive])

  const initializeAgent = async () => {
    setConnectionStatus("connecting")

    try {
      // Simulate ElevenLabs Agent initialization
      // In real implementation, this would connect to ElevenLabs Agents API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setConnectionStatus("connected")
    } catch (error) {
      console.error("Failed to initialize agent:", error)
      setConnectionStatus("disconnected")
    }
  }

  const addWelcomeMessage = () => {
    const welcomeMessages = {
      motivational:
        "Hey there, champion! I'm your AI coach and I'm pumped to help you crush this workout! What exercise are we tackling today?",
      analytical:
        "Hello! I'm your performance analysis coach. I'll be monitoring your form and providing data-driven insights to optimize your training.",
      supportive:
        "Hi! I'm here to support you through your fitness journey. Remember, every rep counts and I'm here to guide you every step of the way.",
    }

    addMessage(welcomeMessages[agentPersona], "agent", "motivation")
  }

  const addMessage = (content: string, type: "user" | "agent", category?: Message["category"]) => {
    const message: Message = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date(),
      category,
    }

    setMessages((prev) => [...prev, message])

    if (type === "agent") {
      onMessage(content, category as any)
      speakMessage(content)
    }
  }

  const generateContextualFeedback = (result: AnalysisResult) => {
    const { score, exercise, feedback, suggestions } = result

    let agentResponse = ""
    let category: Message["category"] = "feedback"

    if (score >= 85) {
      const excellentResponses = [
        "Outstanding form! You're absolutely nailing those " + exercise + "s! Keep that perfect technique going!",
        "Wow! That's textbook " + exercise + " form right there. You're in the zone!",
        "Incredible! Your " + exercise + " technique is spot-on. This is how it's done!",
      ]
      agentResponse = excellentResponses[Math.floor(Math.random() * excellentResponses.length)]
      category = "motivation"
    } else if (score >= 70) {
      agentResponse = `Great work on that ${exercise}! ${feedback} You're doing really well - just a few tweaks and you'll be perfect!`
      category = "feedback"
    } else if (score >= 50) {
      agentResponse = `Good effort on that ${exercise}! ${feedback} ${suggestions[0] || "Focus on your form and you'll improve quickly!"}`
      category = "instruction"
    } else {
      agentResponse = `I can see you're working hard! Let's focus on the basics for this ${exercise}. ${suggestions[0] || "Take your time and focus on proper form over speed."}`
      category = "instruction"
    }

    addMessage(agentResponse, "agent", category)
  }

  const speakMessage = async (text: string) => {
  if (!text) return;

  setIsSpeaking(true);
  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text,
        persona: agentPersona 
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      setIsSpeaking(false);
      URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = () => {
      setIsSpeaking(false);
      URL.revokeObjectURL(audioUrl);
    };

    await audio.play();
  } catch (error) {
    console.error("Speech synthesis error:", error);
    setIsSpeaking(false);
    // Fallback to browser speech if ElevenLabs fails
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
      utterance.onend = () => setIsSpeaking(false);
    }
  }
};

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      addMessage("Speech recognition not supported in this browser", "agent", "feedback")
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      addMessage(transcript, "user")
      processUserInput(transcript)
    }

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const processUserInput = (input: string) => {
    const lowerInput = input.toLowerCase()

    // Simple intent recognition
    if (lowerInput.includes("tired") || lowerInput.includes("exhausted")) {
      addMessage(
        "I hear you're feeling tired. That's completely normal! Let's take a quick 30-second break and then continue with lighter intensity. Remember, consistency beats intensity!",
        "agent",
        "motivation",
      )
    } else if (lowerInput.includes("pain") || lowerInput.includes("hurt")) {
      addMessage(
        "Hold up! If you're experiencing pain, let's stop this exercise immediately. Pain is your body's way of telling us something isn't right. Let's focus on some gentle stretches instead.",
        "agent",
        "instruction",
      )
    } else if (lowerInput.includes("good") || lowerInput.includes("great")) {
      addMessage(
        "That's the spirit! I love your positive energy. You're doing amazing and I can see the improvement in your form!",
        "agent",
        "motivation",
      )
    } else if (lowerInput.includes("help") || lowerInput.includes("how")) {
      addMessage(
        `Great question! For the ${currentExercise}, focus on controlled movements and proper breathing. I'm watching your form and will guide you through each rep!`,
        "agent",
        "instruction",
      )
    } else {
      addMessage(
        "I'm here to help you succeed! Keep up the great work and remember - I'm analyzing your form in real-time to help you improve.",
        "agent",
        "feedback",
      )
    }
  }

  const getPersonaColor = (persona: string) => {
    switch (persona) {
      case "motivational":
        return "bg-orange-100 text-orange-800"
      case "analytical":
        return "bg-blue-100 text-blue-800"
      case "supportive":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Agent Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            AI Coach Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Coach Personality</label>
            <div className="space-y-2">
              {(["motivational", "analytical", "supportive"] as const).map((persona) => (
                <Button
                  key={persona}
                  variant={agentPersona === persona ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setAgentPersona(persona)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {persona.charAt(0).toUpperCase() + persona.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Connection Status</span>
              <Badge variant={connectionStatus === "connected" ? "default" : "secondary"}>{connectionStatus}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={startListening}
              disabled={isListening || !isActive}
              className="w-full"
              variant={isListening ? "destructive" : "default"}
            >
              {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              {isListening ? "Listening..." : "Talk to Coach"}
            </Button>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              {isSpeaking ? (
                <>
                  <Volume2 className="h-4 w-4" />
                  Coach is speaking...
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  Ready to listen
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Conversation with AI Coach</CardTitle>
          <Badge className={getPersonaColor(agentPersona)}>
            {agentPersona.charAt(0).toUpperCase() + agentPersona.slice(1)} Coach
          </Badge>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</span>
                      {message.category && message.type === "agent" && (
                        <Badge variant="outline" className="text-xs">
                          {message.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {!isActive && (
            <div className="text-center text-gray-500 py-8">Start a workout to begin conversing with your AI coach</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
