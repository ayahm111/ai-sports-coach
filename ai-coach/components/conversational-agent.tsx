"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageCircle,
  Zap,
  TrendingUp,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { elevenLabsConfig, isMockMode } from "@/lib/env"
import type { AnalysisResult } from "@/lib/types"

interface ConversationalAgentProps {
  isActive: boolean
  currentExercise: string
  analysisResult: AnalysisResult | null
  recentAnalyses: AnalysisResult[]
  performanceTrend: number | null
  onMessage: (message: string, type: "feedback" | "motivation" | "instruction") => void
}

interface Message {
  id: string
  content: string
  type: "user" | "agent"
  timestamp: Date
  category?: "feedback" | "motivation" | "instruction" | "question"
  basedOnData?: boolean
}

interface ElevenLabsWebSocketMessage {
  type: string
  message?: string
  audio_event?: {
    audio_base_64: string
  }
  user_transcription_event?: {
    user_transcription: string
  }
}

export default function ConversationalAgent({
  isActive,
  currentExercise,
  analysisResult,
  recentAnalyses,
  performanceTrend,
  onMessage,
}: ConversationalAgentProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [agentPersona, setAgentPersona] = useState<"motivational" | "analytical" | "supportive">("motivational")
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">(
    "disconnected",
  )
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastAnalysisRef = useRef<AnalysisResult | null>(null)
  const speechRecognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Add message helper - defined first to avoid dependency issues
  const addMessage = useCallback(
    (content: string, type: "user" | "agent", category?: Message["category"], basedOnData = false) => {
      const message: Message = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        content,
        type,
        timestamp: new Date(),
        category,
        basedOnData,
      }

      setMessages((prev) => [...prev, message])

      if (type === "agent") {
        onMessage(content, category as any)
      }
    },
    [onMessage],
  )

  // Speech synthesis - defined early to be used by addMessage
  const speakMessage = useCallback(
    async (text: string) => {
      if (!text || isSpeaking) return

      setIsSpeaking(true)

      try {
        if (isMockMode || connectionStatus !== "connected") {
          // Use browser TTS or our API fallback
          const response = await fetch("/api/speech", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, persona: agentPersona }),
          })

          if (response.ok) {
            const audioBlob = await response.blob()
            const audioUrl = URL.createObjectURL(audioBlob)

            if (audioRef.current) {
              audioRef.current.pause()
            }

            audioRef.current = new Audio(audioUrl)
            audioRef.current.onended = () => {
              setIsSpeaking(false)
              URL.revokeObjectURL(audioUrl)
            }
            audioRef.current.onerror = () => {
              setIsSpeaking(false)
              URL.revokeObjectURL(audioUrl)
            }

            await audioRef.current.play()
          } else {
            console.warn("Speech synthesis failed")
            setIsSpeaking(false)
          }
        } else {
          // Use ElevenLabs TTS via conversation API
          const response = await fetch("/api/elevenlabs/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              conversation_id: conversationId,
              persona: agentPersona,
            }),
          })

          if (response.ok) {
            const audioBlob = await response.blob()
            const audioUrl = URL.createObjectURL(audioBlob)

            if (audioRef.current) {
              audioRef.current.pause()
            }

            audioRef.current = new Audio(audioUrl)
            audioRef.current.onended = () => {
              setIsSpeaking(false)
              URL.revokeObjectURL(audioUrl)
            }
            audioRef.current.onerror = () => {
              setIsSpeaking(false)
              URL.revokeObjectURL(audioUrl)
            }

            await audioRef.current.play()
          } else {
            console.warn("ElevenLabs TTS failed, falling back to mock")
            // Fallback to mock audio
            const fallbackResponse = await fetch("/api/speech", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text, persona: agentPersona }),
            })

            if (fallbackResponse.ok) {
              const audioBlob = await fallbackResponse.blob()
              const audioUrl = URL.createObjectURL(audioBlob)

              if (audioRef.current) {
                audioRef.current.pause()
              }

              audioRef.current = new Audio(audioUrl)
              audioRef.current.onended = () => {
                setIsSpeaking(false)
                URL.revokeObjectURL(audioUrl)
              }
              audioRef.current.onerror = () => {
                setIsSpeaking(false)
                URL.revokeObjectURL(audioUrl)
              }

              await audioRef.current.play()
            } else {
              setIsSpeaking(false)
            }
          }
        }
      } catch (error) {
        console.error("Speech synthesis error:", error)
        setIsSpeaking(false)
      }
    },
    [isSpeaking, agentPersona, conversationId, connectionStatus],
  )

  // Process user input
  const processUserInput = useCallback(
    (input: string) => {
      const lowerInput = input.toLowerCase()

      // Use actual data to respond to user questions
      if (
        lowerInput.includes("how am i doing") ||
        lowerInput.includes("my score") ||
        lowerInput.includes("performance")
      ) {
        if (analysisResult) {
          const avgScore =
            recentAnalyses.length > 0
              ? Math.round(recentAnalyses.reduce((sum, a) => sum + a.score, 0) / recentAnalyses.length)
              : analysisResult.score

          const response = `Based on your recent ${analysisResult.exercise}, you scored ${analysisResult.score}%. Your average across ${recentAnalyses.length} reps is ${avgScore}%. ${analysisResult.feedback}`
          addMessage(response, "agent", "feedback", true)
          speakMessage(response)
        } else {
          const response =
            "I haven't analyzed any of your movements yet. Start exercising and I'll give you real-time feedback based on your form!"
          addMessage(response, "agent", "instruction")
          speakMessage(response)
        }
      } else if (lowerInput.includes("tired") || lowerInput.includes("exhausted") || lowerInput.includes("fatigue")) {
        let response = ""
        if (performanceTrend !== null && performanceTrend < -3) {
          response = `I can see you might be getting tired - your form score has dropped by ${Math.abs(performanceTrend).toFixed(1)} points recently. Let's take a short break or slow down the pace.`
          addMessage(response, "agent", "supportive", true)
        } else if (recentAnalyses.length > 0) {
          const avgScore = Math.round(recentAnalyses.reduce((sum, a) => sum + a.score, 0) / recentAnalyses.length)
          response = `You're maintaining a ${avgScore}% average form score even when tired - that shows great body awareness! ${avgScore > 75 ? "Keep up the excellent work!" : "Consider taking a brief rest to maintain good form."}`
          addMessage(response, "agent", "supportive", true)
        } else {
          response =
            "It's completely normal to feel tired during workouts. Listen to your body - rest when you need it, and focus on quality over quantity."
          addMessage(response, "agent", "supportive")
        }
        speakMessage(response)
      } else if (lowerInput.includes("pain") || lowerInput.includes("hurt") || lowerInput.includes("injury")) {
        const response =
          "Stop immediately! If you're experiencing pain, we need to pause the workout. Pain is your body's warning system. Please rest and consider consulting a healthcare professional if pain persists."
        addMessage(response, "agent", "instruction", true)
        speakMessage(response)
      } else if (lowerInput.includes("improve") || lowerInput.includes("better") || lowerInput.includes("tips")) {
        let response = ""
        if (analysisResult && analysisResult.suggestions.length > 0) {
          response = `Based on your recent ${analysisResult.exercise} analysis (${analysisResult.score}%), here are specific improvements: ${analysisResult.suggestions.join(". ")} Focus on these points for your next rep!`
          addMessage(response, "agent", "instruction", true)
        } else {
          response =
            "Keep exercising and I'll analyze your form to give you specific improvement tips based on your actual movements!"
          addMessage(response, "agent", "instruction")
          speakMessage(response)
        }
      } else if (lowerInput.includes("good job") || lowerInput.includes("thank you") || lowerInput.includes("thanks")) {
        let response = ""
        if (recentAnalyses.length > 0) {
          const bestScore = Math.max(...recentAnalyses.map((a) => a.score))
          response = `You're very welcome! You've been working hard - your best form score today is ${bestScore}%. Keep up the fantastic effort!`
          addMessage(response, "agent", "motivation", true)
        } else {
          response = "You're welcome! I'm here to help you achieve your fitness goals. Let's keep working together!"
          addMessage(response, "agent", "motivation")
        }
        speakMessage(response)
      } else {
        // Generic response that acknowledges we're watching
        let response = ""
        if (recentAnalyses.length > 0) {
          const latestScore = recentAnalyses[recentAnalyses.length - 1]?.score || 0
          response = `I'm continuously analyzing your form! Your latest ${currentExercise || "exercise"} scored ${latestScore}%. You've completed ${recentAnalyses.length} analyzed reps so far. Keep it up!`
          addMessage(response, "agent", "feedback", true)
        } else {
          response = `I'm ready to analyze your ${currentExercise || "workout"}! Start moving and I'll give you real-time feedback based on your actual form and technique.`
          addMessage(response, "agent", "feedback")
        }
        speakMessage(response)
      }
    },
    [analysisResult, recentAnalyses, performanceTrend, currentExercise, addMessage, speakMessage],
  )

  // Generate data-driven feedback for new analysis results
  const generateDataDrivenFeedback = useCallback(
    (result: AnalysisResult) => {
      const { score, exercise, feedback, suggestions } = result

      let agentResponse = ""
      let category: Message["category"] = "feedback"

      if (score >= 90) {
        const responses = [
          `Incredible! Your ${exercise} just scored ${score}%! That's textbook form - I can see perfect alignment in your pose data!`,
          `Outstanding ${exercise}! ${score}% - your technique is absolutely spot-on. Every landmark is perfectly positioned!`,
          `Wow! ${score}% on that ${exercise}! Your form analysis shows excellent control and precision!`,
        ]
        agentResponse = responses[Math.floor(Math.random() * responses.length)]
        category = "motivation"
      } else if (score >= 80) {
        agentResponse = `Excellent ${exercise}! You scored ${score}%. ${feedback} Your form analysis shows you're maintaining great technique!`
        category = "feedback"
      } else if (score >= 70) {
        agentResponse = `Good ${exercise} - ${score}%! ${feedback} Here's what I observed in your pose data: ${suggestions[0] || "Focus on your alignment."}`
        category = "instruction"
      } else if (score >= 60) {
        agentResponse = `Nice effort on that ${exercise}! You scored ${score}%. ${feedback} Let's work on: ${suggestions[0] || "Basic form fundamentals."}`
        category = "instruction"
      } else {
        agentResponse = `I can see you're working hard on that ${exercise}. You scored ${score}%. ${feedback} Don't worry, let's focus on: ${suggestions[0] || "Taking it slow and steady."}`
        category = "instruction"
      }

      addMessage(agentResponse, "agent", category, true)
      speakMessage(agentResponse)
    },
    [addMessage, speakMessage],
  )

  // Welcome message
  const addWelcomeMessage = useCallback(() => {
    const welcomeMessages = {
      motivational: `Hey there, champion! I'm your AI coach ${isMockMode ? "(running in demo mode)" : "powered by ElevenLabs"}! Let's crush this ${currentExercise || "workout"}! I'll give you real-time feedback based on your actual form.`,
      analytical: `Hello! I'm your performance analysis coach ${isMockMode ? "(demo mode)" : "using ElevenLabs AI"}. I'll analyze your ${currentExercise || "exercise"} form and provide data-driven insights based on your actual movements.`,
      supportive: `Hi! I'm your supportive AI coach ${isMockMode ? "(demo mode)" : "with ElevenLabs technology"}. I'm here to guide you through your ${currentExercise || "workout"} with encouraging feedback based on your real performance.`,
    }

    const message = welcomeMessages[agentPersona]
    addMessage(message, "agent", "motivation", false)
    speakMessage(message)
  }, [agentPersona, currentExercise, addMessage, speakMessage])

  // Fallback to browser speech recognition
  const startBrowserSpeechRecognition = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      addMessage("Speech recognition not supported in this browser", "agent", "feedback")
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"
    recognition.maxAlternatives = 1

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

      if (event.error === "not-allowed") {
        addMessage(
          "Microphone access denied. Please allow microphone permissions and try again.",
          "agent",
          "instruction",
        )
      } else if (event.error === "no-speech") {
        addMessage("No speech detected. Please try speaking again.", "agent", "instruction")
      } else {
        addMessage("Speech recognition error. Please try again.", "agent", "instruction")
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    speechRecognitionRef.current = recognition
    recognition.start()
  }, [addMessage, processUserInput])

  // Handle WebSocket messages from ElevenLabs
  const handleWebSocketMessage = useCallback(
    (data: ElevenLabsWebSocketMessage) => {
      switch (data.type) {
        case "agent_response":
          if (data.message) {
            addMessage(data.message, "agent", "feedback", true)
            speakMessage(data.message)
          }
          break

        case "audio_event":
          if (data.audio_event?.audio_base_64) {
            // Handle base64 audio if needed
          }
          break

        case "user_transcription_event":
          if (data.user_transcription_event?.user_transcription) {
            addMessage(data.user_transcription_event.user_transcription, "user")
          }
          break

        case "conversation_end":
          setIsListening(false)
          setIsSpeaking(false)
          break

        default:
          console.log("Unknown WebSocket message type:", data.type)
      }
    },
    [addMessage, speakMessage],
  )

  // Start voice recording with ElevenLabs
  const startElevenLabsRecording = useCallback(async () => {
    if (!wsConnection || connectionStatus !== "connected") {
      console.error("WebSocket not connected")
      return
    }

    try {
      setIsListening(true)

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setRecordingStream(stream)

      // Create MediaRecorder for audio chunks
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const audioBlob = new Blob([event.data], { type: "audio/webm;codecs=opus" })
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64Audio = (reader.result as string).split(",")[1]
            if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
              wsConnection.send(
                JSON.stringify({
                  type: "audio_chunk",
                  audio_base_64: base64Audio,
                }),
              )
            }
          }
          reader.readAsDataURL(audioBlob)
        }
      }

      recorder.onstop = () => {
        setRecordingStream(null)
        setIsListening(false)
      }

      setMediaRecorder(recorder)
      recorder.start()

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop()
        }
      }, 10000)
    } catch (error) {
      console.error("Error starting recording:", error)
      setIsListening(false)
      addMessage("Microphone access denied. Please allow microphone permissions.", "agent", "instruction")
    }
  }, [wsConnection, connectionStatus, addMessage])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop()
    }
    if (recordingStream) {
      recordingStream.getTracks().forEach((track) => track.stop())
      setRecordingStream(null)
    }
    setIsListening(false)
  }, [mediaRecorder, recordingStream])

  // Handle voice input
  const handleVoiceInput = useCallback(() => {
    if (isMockMode || connectionStatus !== "connected") {
      startBrowserSpeechRecognition()
    } else {
      if (isListening) {
        stopRecording()
      } else {
        startElevenLabsRecording()
      }
    }
  }, [
    isMockMode,
    connectionStatus,
    isListening,
    startBrowserSpeechRecognition,
    startElevenLabsRecording,
    stopRecording,
  ])

  // Initialize ElevenLabs connection
  const initializeElevenLabs = useCallback(async () => {
    if (isMockMode) {
      setConnectionStatus("connected")
      addWelcomeMessage()
      return
    }

    if (!elevenLabsConfig.apiKey || !elevenLabsConfig.agentId) {
      setConnectionStatus("error")
      addMessage(
        "⚠️ ElevenLabs API key or Agent ID not configured. Please add your credentials to use voice features.",
        "agent",
        "instruction",
      )
      return
    }

    try {
      setConnectionStatus("connecting")

      // Create conversation session
      const response = await fetch("/api/elevenlabs/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: elevenLabsConfig.agentId,
          persona: agentPersona,
          context: {
            current_exercise: currentExercise,
            is_active: isActive,
            recent_analyses_count: recentAnalyses.length,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to create conversation: ${response.status} - ${errorText}`)

        // Check if it's the unusual activity error
        if (response.status === 401 && errorText.includes("detected_unusual_activity")) {
          addMessage(
            "🚨 ElevenLabs detected unusual activity. This often happens on shared hosting. Try running locally with 'npm run dev' to avoid this issue.",
            "agent",
            "instruction",
          )
        } else {
          addMessage("Failed to connect to ElevenLabs. Falling back to mock mode.", "agent", "instruction")
        }

        setConnectionStatus("error")
        return
      }

      const { conversation_id } = await response.json()
      setConversationId(conversation_id)

      // Initialize WebSocket connection
      const wsUrl = `${elevenLabsConfig.wsUrl}?conversation_id=${conversation_id}`
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log("✅ ElevenLabs WebSocket connected")
        setConnectionStatus("connected")
        setWsConnection(ws)
        addWelcomeMessage()
      }

      ws.onmessage = (event) => {
        handleWebSocketMessage(JSON.parse(event.data))
      }

      ws.onerror = (error) => {
        console.error("ElevenLabs WebSocket error:", error)
        setConnectionStatus("error")
        addMessage("Connection error. Falling back to mock mode.", "agent", "instruction")
      }

      ws.onclose = () => {
        console.log("ElevenLabs WebSocket disconnected")
        setConnectionStatus("disconnected")
        setWsConnection(null)
      }
    } catch (error) {
      console.error("Failed to initialize ElevenLabs:", error)
      setConnectionStatus("error")
      addMessage(
        "Failed to connect to ElevenLabs. Please check your API credentials and try again.",
        "agent",
        "instruction",
      )
    }
  }, [
    agentPersona,
    currentExercise,
    isActive,
    recentAnalyses.length,
    addWelcomeMessage,
    handleWebSocketMessage,
    addMessage,
  ])

  // Send context update to ElevenLabs
  const sendContextUpdate = useCallback(
    async (analysis: AnalysisResult) => {
      if (!wsConnection || connectionStatus !== "connected") return

      const contextUpdate = {
        type: "context_update",
        context: {
          latest_analysis: {
            exercise: analysis.exercise,
            score: analysis.score,
            feedback: analysis.feedback,
            suggestions: analysis.suggestions,
            timestamp: analysis.timestamp,
          },
          performance_trend: performanceTrend,
          session_stats: {
            total_analyses: recentAnalyses.length,
            average_score:
              recentAnalyses.length > 0
                ? Math.round(recentAnalyses.reduce((sum, a) => sum + a.score, 0) / recentAnalyses.length)
                : 0,
            best_score: recentAnalyses.length > 0 ? Math.max(...recentAnalyses.map((a) => a.score)) : 0,
          },
        },
      }

      wsConnection.send(JSON.stringify(contextUpdate))
    },
    [wsConnection, connectionStatus, performanceTrend, recentAnalyses],
  )

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize when active
  useEffect(() => {
    if (isActive) {
      initializeElevenLabs()
    } else {
      // Cleanup when inactive
      if (wsConnection) {
        wsConnection.close()
      }
      if (recordingStream) {
        recordingStream.getTracks().forEach((track) => track.stop())
      }
      setConnectionStatus("disconnected")
      setMessages([])
    }

    return () => {
      if (wsConnection) {
        wsConnection.close()
      }
      if (recordingStream) {
        recordingStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [isActive, initializeElevenLabs])

  // React to NEW analysis results
  useEffect(() => {
    if (analysisResult && isActive && analysisResult !== lastAnalysisRef.current) {
      lastAnalysisRef.current = analysisResult
      sendContextUpdate(analysisResult)

      // Generate immediate feedback in mock mode
      if (isMockMode) {
        generateDataDrivenFeedback(analysisResult)
      }
    }
  }, [analysisResult, isActive, sendContextUpdate, generateDataDrivenFeedback])

  // Persona change - reinitialize connection
  useEffect(() => {
    if (isActive && connectionStatus === "connected") {
      // Close current connection and reinitialize with new persona
      if (wsConnection) {
        wsConnection.close()
      }
      setTimeout(() => {
        initializeElevenLabs()
      }, 1000)
    }
  }, [agentPersona, isActive, connectionStatus, wsConnection, initializeElevenLabs])

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

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "default"
      case "connecting":
        return "secondary"
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ElevenLabs Configuration Alert */}
      {isMockMode && (
        <div className="lg:col-span-3">
          <Alert className="border-yellow-200 bg-yellow-50">
            <Zap className="h-4 w-4" />
            <AlertDescription className="text-yellow-800">
              <strong>Demo Mode Active:</strong> Add your ElevenLabs API key and Agent ID to <code>.env.local</code> for
              full voice conversation features. Currently using browser speech recognition.
              <br />
              <span className="text-sm">
                💡 <strong>Tip:</strong> If you get "unusual activity" errors, try running locally with{" "}
                <code>npm run dev</code>
              </span>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Connection Error Alert */}
      {connectionStatus === "error" && !isMockMode && (
        <div className="lg:col-span-3">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>ElevenLabs Connection Failed:</strong> This often happens due to "unusual activity" detection on
              shared hosting.
              <br />
              <span className="text-sm">
                🔧 <strong>Solution:</strong> Run locally with <code>npm run dev</code> to avoid shared IP issues.
              </span>
            </AlertDescription>
          </Alert>
        </div>
      )}

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
                  disabled={connectionStatus === "connecting"}
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
              <div className="flex items-center gap-2">
                {connectionStatus === "connected" ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-gray-400" />
                )}
                <Badge variant={getConnectionStatusColor(connectionStatus)}>{connectionStatus}</Badge>
              </div>
            </div>

            {!isMockMode && conversationId && (
              <div className="text-xs text-gray-600 mb-2">Session: {conversationId.slice(0, 8)}...</div>
            )}

            {/* Data-driven insights */}
            {recentAnalyses.length > 0 && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span>Real-time Analysis Active</span>
                </div>
                <div className="text-gray-600">{recentAnalyses.length} reps analyzed</div>
                {performanceTrend !== null && (
                  <div className={`text-xs ${performanceTrend > 0 ? "text-green-600" : "text-red-600"}`}>
                    Trend: {performanceTrend > 0 ? "+" : ""}
                    {performanceTrend.toFixed(1)} points
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleVoiceInput}
              disabled={!isActive || connectionStatus === "connecting"}
              className="w-full"
              variant={isListening ? "destructive" : "default"}
            >
              {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              {isListening ? "Stop Listening" : "Talk to Coach"}
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
          <div className="flex items-center gap-2">
            <Badge className={getPersonaColor(agentPersona)}>
              {agentPersona.charAt(0).toUpperCase() + agentPersona.slice(1)} Coach
            </Badge>
            {!isMockMode && connectionStatus === "connected" && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                🎙️ ElevenLabs Ready
              </Badge>
            )}
            {(isMockMode || connectionStatus !== "connected") && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                🎤 Browser STT
              </Badge>
            )}
            {recentAnalyses.length > 0 && (
              <Badge variant="outline" className="text-xs">
                📊 Data-driven
              </Badge>
            )}
          </div>
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
                      <div className="flex gap-1">
                        {message.category && message.type === "agent" && (
                          <Badge variant="outline" className="text-xs">
                            {message.category}
                          </Badge>
                        )}
                        {message.basedOnData && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            📊 Real Data
                          </Badge>
                        )}
                      </div>
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
