"use client"

import { Activity, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { PoseData } from "@/lib/types"

interface PoseAnalysisProps {
  pose: PoseData | null
  exercise: string
  isAnalyzing: boolean
}

export default function PoseAnalysis({ pose, exercise, isAnalyzing }: PoseAnalysisProps) {
  if (!pose) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-500">
        <Activity className="h-8 w-8 mb-2" />
        <p className="text-sm">Waiting for pose detection...</p>
      </div>
    )
  }

  const getPostureScore = (landmarks: any[]): number => {
    // Enhanced posture scoring
    const leftShoulder = landmarks.find((l) => l.name === "left_shoulder")
    const rightShoulder = landmarks.find((l) => l.name === "right_shoulder")
    const leftHip = landmarks.find((l) => l.name === "left_hip")
    const rightHip = landmarks.find((l) => l.name === "right_hip")
    const leftKnee = landmarks.find((l) => l.name === "left_knee")
    const rightKnee = landmarks.find((l) => l.name === "right_knee")

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      return 0
    }

    let score = 100

    // Check shoulder alignment
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y)
    if (shoulderDiff > 0.05) {
      score -= 15
    }

    // Check hip alignment
    const hipDiff = Math.abs(leftHip.y - rightHip.y)
    if (hipDiff > 0.05) {
      score -= 15
    }

    // Check body symmetry
    const leftSide = Math.abs(leftShoulder.x - leftHip.x)
    const rightSide = Math.abs(rightShoulder.x - rightHip.x)
    const symmetryDiff = Math.abs(leftSide - rightSide)
    if (symmetryDiff > 0.1) {
      score -= 20
    }

    // Exercise-specific scoring
    if (exercise === "squat" && leftKnee && rightKnee) {
      const kneeAlignment = Math.abs(leftKnee.y - rightKnee.y)
      if (kneeAlignment > 0.08) {
        score -= 25
      }
    }

    return Math.max(0, Math.round(score))
  }

  const getVisibilityScore = (landmarks: any[]): number => {
    const visibleLandmarks = landmarks.filter((l) => l.visibility > 0.5)
    return Math.round((visibleLandmarks.length / landmarks.length) * 100)
  }

  const getFormFeedback = (score: number, exercise: string): string => {
    if (score >= 90) {
      return `Excellent ${exercise} form! Keep it up!`
    } else if (score >= 80) {
      return `Good ${exercise} form with minor adjustments needed.`
    } else if (score >= 70) {
      return `Your ${exercise} form needs some attention.`
    } else if (score >= 60) {
      return `Focus on proper ${exercise} alignment.`
    } else {
      return `Let's work on basic ${exercise} positioning.`
    }
  }

  const postureScore = getPostureScore(pose.landmarks)
  const visibilityScore = getVisibilityScore(pose.landmarks)
  const overallScore = Math.round((postureScore + visibilityScore) / 2)
  const feedback = getFormFeedback(overallScore, exercise || "exercise")

  return (
    <div className="space-y-4">
      {isAnalyzing && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          Analyzing pose...
        </div>
      )}

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Form Score</span>
            <Badge variant={overallScore >= 80 ? "default" : overallScore >= 60 ? "secondary" : "destructive"}>
              {overallScore}%
            </Badge>
          </div>
          <Progress value={overallScore} className="h-3" />
          <p className="text-xs text-gray-600 mt-1">{feedback}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Posture Alignment</span>
            <span className="text-sm text-gray-600">{postureScore}%</span>
          </div>
          <Progress value={postureScore} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Body Visibility</span>
            <span className="text-sm text-gray-600">{visibilityScore}%</span>
          </div>
          <Progress value={visibilityScore} className="h-2" />
        </div>
      </div>

      <div className="pt-3 border-t">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">Detection Status</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span>{pose.landmarks.length} landmarks tracked</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">Last updated: {new Date(pose.timestamp).toLocaleTimeString()}</div>
      </div>

      {overallScore < 60 && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-yellow-800">Form Alert</div>
            <div className="text-yellow-700">
              {exercise === "squat" && "Keep your knees aligned and back straight"}
              {exercise === "pushup" && "Maintain a straight line from head to heels"}
              {exercise === "plank" && "Keep your core engaged and body straight"}
              {exercise === "lunge" && "Keep your front knee over your ankle"}
              {!exercise && "Focus on proper body alignment"}
            </div>
          </div>
        </div>
      )}

      {overallScore >= 85 && (
        <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-green-800">Perfect Form!</div>
            <div className="text-green-700">Your technique is excellent. Keep it up!</div>
          </div>
        </div>
      )}
    </div>
  )
}
