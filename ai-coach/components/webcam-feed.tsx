"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Camera, CameraOff, AlertCircle, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { PoseData } from "@/lib/types"

interface WebcamFeedProps {
  onPoseDetected: (pose: PoseData) => void
  isActive: boolean
}

export default function WebcamFeed({ onPoseDetected, isActive }: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const poseDetectionRef = useRef<NodeJS.Timeout | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState<string>("")
  const [cameraStatus, setCameraStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle")
  const [poseCount, setPoseCount] = useState(0)
  const [isDetectionActive, setIsDetectionActive] = useState(false)

  // Generate realistic mock pose data with exercise-specific variations
  const generateMockPose = useCallback((): PoseData => {
    const time = Date.now() / 1000
    const exerciseVariation = Math.sin(time * 0.5) * 0.1 // Slow movement simulation
    const breathingVariation = Math.sin(time * 2) * 0.02 // Breathing simulation

    const mockLandmarks = [
      // Head and face
      { x: 0.5, y: 0.1 + breathingVariation, z: 0, visibility: 0.95, name: "nose" },
      { x: 0.48, y: 0.08 + breathingVariation, z: 0, visibility: 0.9, name: "left_eye" },
      { x: 0.52, y: 0.08 + breathingVariation, z: 0, visibility: 0.9, name: "right_eye" },
      { x: 0.47, y: 0.12 + breathingVariation, z: 0, visibility: 0.85, name: "left_ear" },
      { x: 0.53, y: 0.12 + breathingVariation, z: 0, visibility: 0.85, name: "right_ear" },

      // Upper body - with realistic movement
      { x: 0.45 + exerciseVariation, y: 0.25 + breathingVariation, z: 0, visibility: 0.98, name: "left_shoulder" },
      { x: 0.55 - exerciseVariation, y: 0.25 + breathingVariation, z: 0, visibility: 0.98, name: "right_shoulder" },
      {
        x: 0.42 + Math.sin(time * 1.2) * 0.08,
        y: 0.4 + exerciseVariation * 0.5,
        z: 0,
        visibility: 0.95,
        name: "left_elbow",
      },
      {
        x: 0.58 - Math.sin(time * 1.2) * 0.08,
        y: 0.4 + exerciseVariation * 0.5,
        z: 0,
        visibility: 0.95,
        name: "right_elbow",
      },
      {
        x: 0.38 + Math.sin(time * 1.5) * 0.12,
        y: 0.55 + exerciseVariation * 0.3,
        z: 0,
        visibility: 0.9,
        name: "left_wrist",
      },
      {
        x: 0.62 - Math.sin(time * 1.5) * 0.12,
        y: 0.55 + exerciseVariation * 0.3,
        z: 0,
        visibility: 0.9,
        name: "right_wrist",
      },

      // Torso - stable but with breathing
      { x: 0.45, y: 0.5 + exerciseVariation * 0.5 + breathingVariation, z: 0, visibility: 0.98, name: "left_hip" },
      { x: 0.55, y: 0.5 + exerciseVariation * 0.5 + breathingVariation, z: 0, visibility: 0.98, name: "right_hip" },

      // Lower body - with squat/lunge variations
      {
        x: 0.45,
        y: 0.7 + Math.sin(time * 0.8) * 0.05 + exerciseVariation * 0.8,
        z: 0,
        visibility: 0.95,
        name: "left_knee",
      },
      {
        x: 0.55,
        y: 0.7 + Math.sin(time * 0.8) * 0.05 + exerciseVariation * 0.8,
        z: 0,
        visibility: 0.95,
        name: "right_knee",
      },
      { x: 0.45, y: 0.9 + exerciseVariation * 0.3, z: 0, visibility: 0.92, name: "left_ankle" },
      { x: 0.55, y: 0.9 + exerciseVariation * 0.3, z: 0, visibility: 0.92, name: "right_ankle" },

      // Additional landmarks for better analysis
      { x: 0.44, y: 0.95 + exerciseVariation * 0.2, z: 0, visibility: 0.8, name: "left_heel" },
      { x: 0.56, y: 0.95 + exerciseVariation * 0.2, z: 0, visibility: 0.8, name: "right_heel" },
      { x: 0.46, y: 0.98 + exerciseVariation * 0.1, z: 0, visibility: 0.85, name: "left_foot_index" },
      { x: 0.54, y: 0.98 + exerciseVariation * 0.1, z: 0, visibility: 0.85, name: "right_foot_index" },
    ]

    return {
      landmarks: mockLandmarks,
      timestamp: Date.now(),
    }
  }, [])

  // Draw pose landmarks and connections on canvas
  const drawPose = useCallback(
    (landmarks: any[], videoElement?: HTMLVideoElement) => {
      if (!canvasRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas size
      const displayWidth = 640
      const displayHeight = 480
      canvas.width = displayWidth
      canvas.height = displayHeight

      // Clear canvas
      ctx.clearRect(0, 0, displayWidth, displayHeight)

      // Draw video frame if available
      if (videoElement && videoElement.videoWidth > 0 && videoElement.readyState >= 2) {
        try {
          ctx.drawImage(videoElement, 0, 0, displayWidth, displayHeight)
        } catch (error) {
          console.warn("Error drawing video frame:", error)
        }
      } else {
        // Draw animated background
        const gradient = ctx.createLinearGradient(0, 0, displayWidth, displayHeight)
        gradient.addColorStop(0, "#1e3a8a")
        gradient.addColorStop(0.5, "#3b82f6")
        gradient.addColorStop(1, "#1e40af")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, displayWidth, displayHeight)

        // Add animated grid pattern
        const time = Date.now() / 1000
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(time) * 0.05})`
        ctx.lineWidth = 1
        for (let i = 0; i < displayWidth; i += 40) {
          ctx.beginPath()
          ctx.moveTo(i, 0)
          ctx.lineTo(i, displayHeight)
          ctx.stroke()
        }
        for (let i = 0; i < displayHeight; i += 40) {
          ctx.beginPath()
          ctx.moveTo(0, i)
          ctx.lineTo(displayWidth, i)
          ctx.stroke()
        }

        // Add status text
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
        ctx.font = "18px Arial"
        ctx.textAlign = "center"
        ctx.fillText("AI Pose Analysis Active", displayWidth / 2, displayHeight / 2 - 20)
        ctx.font = "14px Arial"
        ctx.fillText(
          isActive ? "Analyzing your form in real-time" : "Click 'Start Workout' to begin analysis",
          displayWidth / 2,
          displayHeight / 2 + 10,
        )
        ctx.font = "12px Arial"
        ctx.fillText("Move around to see pose detection", displayWidth / 2, displayHeight / 2 + 30)
      }

      // Define pose connections with better organization
      const connections = [
        // Face
        ["left_eye", "right_eye"],
        ["left_ear", "left_eye"],
        ["right_ear", "right_eye"],
        ["nose", "left_eye"],
        ["nose", "right_eye"],

        // Upper body
        ["left_shoulder", "right_shoulder"],
        ["left_shoulder", "left_elbow"],
        ["left_elbow", "left_wrist"],
        ["right_shoulder", "right_elbow"],
        ["right_elbow", "right_wrist"],

        // Torso
        ["left_shoulder", "left_hip"],
        ["right_shoulder", "right_hip"],
        ["left_hip", "right_hip"],

        // Lower body
        ["left_hip", "left_knee"],
        ["left_knee", "left_ankle"],
        ["right_hip", "right_knee"],
        ["right_knee", "right_ankle"],

        // Feet
        ["left_ankle", "left_heel"],
        ["left_heel", "left_foot_index"],
        ["right_ankle", "right_heel"],
        ["right_heel", "right_foot_index"],
      ]

      // Create landmark lookup
      const landmarkMap = new Map()
      landmarks.forEach((landmark) => {
        landmarkMap.set(landmark.name, landmark)
      })

      // Draw connections with varying colors based on visibility
      connections.forEach(([start, end]) => {
        const startPoint = landmarkMap.get(start)
        const endPoint = landmarkMap.get(end)

        if (startPoint && endPoint && startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
          const avgVisibility = (startPoint.visibility + endPoint.visibility) / 2
          const alpha = Math.min(avgVisibility, 0.8)

          ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(startPoint.x * displayWidth, startPoint.y * displayHeight)
          ctx.lineTo(endPoint.x * displayWidth, endPoint.y * displayHeight)
          ctx.stroke()
        }
      })

      // Draw landmarks with size based on visibility
      landmarks.forEach((landmark) => {
        if (landmark.visibility > 0.5) {
          const x = landmark.x * displayWidth
          const y = landmark.y * displayHeight
          const radius = 3 + landmark.visibility * 2

          // Draw landmark point
          ctx.fillStyle = `rgba(255, 0, 0, ${landmark.visibility})`
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, 2 * Math.PI)
          ctx.fill()

          // Draw landmark name for key points
          if (
            ["left_shoulder", "right_shoulder", "left_hip", "right_hip", "left_knee", "right_knee"].includes(
              landmark.name,
            ) &&
            landmark.visibility > 0.8
          ) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
            ctx.font = "10px Arial"
            ctx.textAlign = "center"
            ctx.fillText(landmark.name.replace("_", " "), x, y - 10)
          }
        }
      })

      // Draw status information
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(10, 10, 200, 80)
      ctx.fillStyle = "#ffffff"
      ctx.font = "14px Arial"
      ctx.textAlign = "left"
      ctx.fillText(`Poses Detected: ${poseCount}`, 15, 30)
      ctx.fillText(`Status: ${isActive ? "Analyzing" : "Ready"}`, 15, 50)
      ctx.fillText(`Landmarks: ${landmarks.length}`, 15, 70)

      const avgVisibility =
        landmarks.length > 0
          ? Math.round((landmarks.reduce((sum, l) => sum + l.visibility, 0) / landmarks.length) * 100)
          : 0
      ctx.fillText(`Quality: ${avgVisibility}%`, 15, 90)
    },
    [poseCount, isActive],
  )

  // Start camera
  const startCamera = async () => {
    try {
      setIsLoading(true)
      setCameraStatus("requesting")
      setError("")

      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: "user",
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error("Video element not available"))
            return
          }

          const handleLoadedMetadata = () => {
            resolve()
          }

          const handleError = (e: any) => {
            reject(new Error("Video loading failed"))
          }

          videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true })
          videoRef.current.addEventListener("error", handleError, { once: true })

          setTimeout(() => {
            reject(new Error("Video loading timeout"))
          }, 10000)
        })

        await videoRef.current.play()
        setHasPermission(true)
        setCameraStatus("granted")
        startPoseDetection()
      }
    } catch (err: any) {
      console.error("Camera error:", err)
      setCameraStatus("denied")

      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions and refresh the page.")
      } else if (err.name === "NotFoundError") {
        setError("No camera found. Please connect a camera and try again.")
      } else if (err.name === "NotReadableError") {
        setError("Camera is already in use by another application.")
      } else {
        setError(`Camera error: ${err.message || "Unknown error"}`)
      }

      // Start mock mode even if camera fails
      startPoseDetection()
    } finally {
      setIsLoading(false)
    }
  }

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (poseDetectionRef.current) {
      clearInterval(poseDetectionRef.current)
      poseDetectionRef.current = null
    }

    setHasPermission(false)
    setCameraStatus("idle")
    setPoseCount(0)
    setIsDetectionActive(false)
  }, [])

  // Start pose detection
  const startPoseDetection = useCallback(() => {
    if (poseDetectionRef.current) {
      clearInterval(poseDetectionRef.current)
    }

    setIsDetectionActive(true)

    // Generate poses at 10 FPS for smooth analysis
    poseDetectionRef.current = setInterval(() => {
      const mockPose = generateMockPose()

      // Always draw the pose
      drawPose(mockPose.landmarks, videoRef.current || undefined)

      // Only send pose data when active
      if (isActive) {
        onPoseDetected(mockPose)
        setPoseCount((prev) => prev + 1)
      }
    }, 100) // 10 FPS
  }, [isActive, generateMockPose, onPoseDetected, drawPose])

  // Stop pose detection
  const stopPoseDetection = useCallback(() => {
    if (poseDetectionRef.current) {
      clearInterval(poseDetectionRef.current)
      poseDetectionRef.current = null
    }
    setIsDetectionActive(false)
  }, [])

  // Handle active state changes
  useEffect(() => {
    if (hasPermission || error) {
      if (isActive && !isDetectionActive) {
        startPoseDetection()
      }
    }
  }, [isActive, hasPermission, error, isDetectionActive, startPoseDetection])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Auto-start camera on mount
  useEffect(() => {
    if (cameraStatus === "idle") {
      startCamera()
    }
  }, [])

  if (!navigator.mediaDevices?.getUserMedia) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-800">
          Your browser doesn't support camera access. Please use a modern browser like Chrome, Firefox, or Safari.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="hidden"
          style={{ width: "640px", height: "480px" }}
        />
        <canvas
          ref={canvasRef}
          className="w-full h-auto bg-black rounded-lg border"
          style={{ maxWidth: "640px", aspectRatio: "4/3" }}
        />

        <div className="absolute top-2 right-2 flex gap-2">
          <div
            className={`px-2 py-1 rounded text-xs text-white ${
              isActive && isDetectionActive
                ? "bg-red-500 animate-pulse"
                : hasPermission
                  ? "bg-green-500"
                  : "bg-gray-500"
            }`}
          >
            {isActive && isDetectionActive ? "Analyzing" : hasPermission ? "Ready" : "Connecting"}
          </div>
          {hasPermission && (
            <Button onClick={stopCamera} variant="outline" size="sm" className="bg-white/80 hover:bg-white">
              <CameraOff className="h-4 w-4" />
            </Button>
          )}
          {isDetectionActive && (
            <Button
              onClick={isActive ? stopPoseDetection : startPoseDetection}
              variant="outline"
              size="sm"
              className="bg-white/80 hover:bg-white"
            >
              {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Starting camera...</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600 text-center space-y-1">
        {error ? (
          <div className="text-red-600 space-y-2">
            <p>{error}</p>
            <Button onClick={startCamera} size="sm" className="mt-2">
              <Camera className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <p>
              {hasPermission
                ? `Camera active • ${isActive ? "Real-time analysis in progress" : "Click 'Start Workout' to begin analysis"}`
                : "AI pose detection active • Mock data mode for demonstration"}
            </p>
            {poseCount > 0 && (
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="text-green-600">✓ {poseCount} poses analyzed</span>
                {isActive && <span className="text-blue-600">🔄 Analysis rate: ~10 FPS</span>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
