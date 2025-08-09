"use client";

import { Activity, TrendingUp, AlertTriangle } from "lucide-react"
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
        <p className="text-sm">No pose detected</p>
      </div>
    )
  }

  const getPostureScore = (landmarks: any[]): number => {
    // Simple posture scoring based on key landmarks
    const leftShoulder = landmarks.find((l) => l.name === "left_shoulder")
    const rightShoulder = landmarks.find((l) => l.name === "right_shoulder")
    const leftHip = landmarks.find((l) => l.name === "left_hip")
    const rightHip = landmarks.find((l) => l.name === "right_hip")

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      return 0
    }

    // Calculate shoulder alignment
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y)
    const hipDiff = Math.abs(leftHip.y - rightHip.y)

    // Score based on alignment (lower difference = better score)
    const alignmentScore = Math.max(0, 100 - (shoulderDiff + hipDiff) * 1000)

    return Math.round(alignmentScore)
  }

  const getVisibilityScore = (landmarks: any[]): number => {
    const visibleLandmarks = landmarks.filter((l) => l.visibility > 0.5)
    return Math.round((visibleLandmarks.length / landmarks.length) * 100)
  }

  const postureScore = getPostureScore(pose.landmarks)
  const visibilityScore = getVisibilityScore(pose.landmarks)
  const overallScore = Math.round((postureScore + visibilityScore) / 2)

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
            <span className="text-sm font-medium">Overall Score</span>
            <Badge variant={overallScore >= 80 ? "default" : overallScore >= 60 ? "secondary" : "destructive"}>
              {overallScore}%
            </Badge>
          </div>
          <Progress value={overallScore} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Posture</span>
            <span className="text-sm text-gray-600">{postureScore}%</span>
          </div>
          <Progress value={postureScore} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Visibility</span>
            <span className="text-sm text-gray-600">{visibilityScore}%</span>
          </div>
          <Progress value={visibilityScore} className="h-2" />
        </div>
      </div>

      <div className="pt-3 border-t">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">Key Points Detected</span>
        </div>
        <div className="text-xs text-gray-600">{pose.landmarks.length} landmarks tracked</div>
      </div>

      {overallScore < 60 && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-yellow-800">Form Alert</div>
            <div className="text-yellow-700">Consider adjusting your position for better form analysis</div>
          </div>
        </div>
      )}
    </div>
  )
}
