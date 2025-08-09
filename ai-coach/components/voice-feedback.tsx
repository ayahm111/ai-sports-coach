"use client";

import { useState, useEffect } from "react"
import { Volume2, VolumeX, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoiceFeedbackProps {
  text: string
  autoPlay?: boolean
}

export default function VoiceFeedback({ text, autoPlay = false }: VoiceFeedbackProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [audioUrl, setAudioUrl] = useState<string>("")

  const generateSpeech = async (textToSpeak: string) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textToSpeak }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate speech")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)

      if (autoPlay) {
        playAudio(url)
      }
    } catch (err) {
      setError("Voice feedback unavailable")
      console.error("Speech generation error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const playAudio = (url: string) => {
    const audio = new Audio(url)
    setIsPlaying(true)

    audio.onended = () => {
      setIsPlaying(false)
    }

    audio.onerror = () => {
      setError("Failed to play audio")
      setIsPlaying(false)
    }

    audio.play().catch(() => {
      setError("Audio playback failed")
      setIsPlaying(false)
    })
  }

  const handlePlayClick = () => {
    if (audioUrl) {
      playAudio(audioUrl)
    } else {
      generateSpeech(text)
    }
  }

  useEffect(() => {
    if (autoPlay && text && !audioUrl) {
      generateSpeech(text)
    }
  }, [text, autoPlay, audioUrl])

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <VolumeX className="h-4 w-4" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePlayClick}
        disabled={isLoading || isPlaying}
        className="flex items-center gap-2 bg-transparent"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
        {isLoading ? "Generating..." : isPlaying ? "Playing..." : "Play Feedback"}
      </Button>
    </div>
  )
}
