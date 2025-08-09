"use client";

import { Activity, TrendingUp, AlertTriangle, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { PoseData } from "@/lib/types";

interface PoseAnalysisProps {
  pose: PoseData | null;
  exercise: string;
  isAnalyzing: boolean;
}

export default function PoseAnalysis({ pose, exercise, isAnalyzing }: PoseAnalysisProps) {
  if (!pose) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-500">
        <Activity className="h-8 w-8 mb-2" />
        <p className="text-sm">No pose detected</p>
      </div>
    );
  }
  // Add to your PoseAnalysis component
const getDetailedFeedback = (pose: PoseData, exercise: string) => {
  if (!pose.landmarks.length) return [];
  
  const feedback = [];
  
  // Example checks
  const leftShoulder = pose.landmarks.find(l => l.name === 'left_shoulder');
  const rightShoulder = pose.landmarks.find(l => l.name === 'right_shoulder');
  
  if (leftShoulder && rightShoulder) {
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    if (shoulderDiff > 0.1) {
      feedback.push("Your shoulders are uneven");
    }
  }

  // Add exercise-specific checks
  if (exercise.toLowerCase().includes('squat')) {
    const leftKnee = pose.landmarks.find(l => l.name === 'left_knee');
    const leftAnkle = pose.landmarks.find(l => l.name === 'left_ankle');
    
    if (leftKnee && leftAnkle && Math.abs(leftKnee.x - leftAnkle.x) > 0.15) {
      feedback.push("Your left knee is collapsing inward");
    }
  }

  return feedback.length > 0 ? feedback : ["Good form detected!"];
};

// Then use it in your component
const detailedFeedback = getDetailedFeedback(pose, exercise);
  const getPostureScore = (landmarks: any[]): number => {
    // More sophisticated posture scoring
    const keyPoints = {
      leftShoulder: landmarks.find((l) => l.name === "left_shoulder"),
      rightShoulder: landmarks.find((l) => l.name === "right_shoulder"),
      leftHip: landmarks.find((l) => l.name === "left_hip"),
      rightHip: landmarks.find((l) => l.name === "right_hip"),
      leftKnee: landmarks.find((l) => l.name === "left_knee"),
      rightKnee: landmarks.find((l) => l.name === "right_knee"),
      leftAnkle: landmarks.find((l) => l.name === "left_ankle"),
      rightAnkle: landmarks.find((l) => l.name === "right_ankle"),
    };

    if (!keyPoints.leftShoulder || !keyPoints.rightShoulder || !keyPoints.leftHip || !keyPoints.rightHip) {
      return 0;
    }

    // Calculate alignment scores
    const shoulderAlignment = 1 - Math.abs(keyPoints.leftShoulder.y - keyPoints.rightShoulder.y);
    const hipAlignment = 1 - Math.abs(keyPoints.leftHip.y - keyPoints.rightHip.y);
    
    // Calculate joint angles (simplified)
    let kneeAlignment = 1;
    if (keyPoints.leftKnee && keyPoints.leftAnkle && keyPoints.leftHip) {
      const kneeAngle = Math.abs(keyPoints.leftKnee.y - keyPoints.leftHip.y) / 
                        Math.abs(keyPoints.leftAnkle.y - keyPoints.leftKnee.y);
      kneeAlignment = 1 - Math.min(Math.abs(kneeAngle - 1), 1);
    }

    // Weighted average of alignment scores
    const alignmentScore = (shoulderAlignment * 0.4 + hipAlignment * 0.3 + kneeAlignment * 0.3) * 100;
    return Math.round(alignmentScore);
  };


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
