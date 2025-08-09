import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { AnalysisResult, PoseData } from "@/lib/types"

const AnalyzeRequestSchema = z.object({
  exercise: z.string().min(1),
  pose: z.object({
    landmarks: z.array(
      z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
        visibility: z.number(),
        name: z.string(),
      }),
    ),
    timestamp: z.number(),
  }),
  timestamp: z.number(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { exercise, pose, timestamp } = AnalyzeRequestSchema.parse(body)

    // Analyze the pose based on the exercise type
    const analysis = analyzePoseForExercise(exercise, pose)

    const result: AnalysisResult = {
      exercise,
      score: analysis.score,
      feedback: analysis.feedback,
      suggestions: analysis.suggestions,
      timestamp: Date.now(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Analysis error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}

function analyzePoseForExercise(exercise: string, pose: PoseData) {
  const landmarks = pose.landmarks

  // Get key landmarks
  const leftShoulder = landmarks.find((l) => l.name === "left_shoulder")
  const rightShoulder = landmarks.find((l) => l.name === "right_shoulder")
  const leftElbow = landmarks.find((l) => l.name === "left_elbow")
  const rightElbow = landmarks.find((l) => l.name === "right_elbow")
  const leftWrist = landmarks.find((l) => l.name === "left_wrist")
  const rightWrist = landmarks.find((l) => l.name === "right_wrist")
  const leftHip = landmarks.find((l) => l.name === "left_hip")
  const rightHip = landmarks.find((l) => l.name === "right_hip")
  const leftKnee = landmarks.find((l) => l.name === "left_knee")
  const rightKnee = landmarks.find((l) => l.name === "right_knee")
  const leftAnkle = landmarks.find((l) => l.name === "left_ankle")
  const rightAnkle = landmarks.find((l) => l.name === "right_ankle")

  switch (exercise) {
    case "squat":
      return analyzeSquat({
        leftHip,
        rightHip,
        leftKnee,
        rightKnee,
        leftAnkle,
        rightAnkle,
        leftShoulder,
        rightShoulder,
      })

    case "pushup":
      return analyzePushup({
        leftShoulder,
        rightShoulder,
        leftElbow,
        rightElbow,
        leftWrist,
        rightWrist,
        leftHip,
        rightHip,
      })

    case "plank":
      return analyzePlank({
        leftShoulder,
        rightShoulder,
        leftHip,
        rightHip,
        leftAnkle,
        rightAnkle,
      })

    case "lunge":
      return analyzeLunge({
        leftHip,
        rightHip,
        leftKnee,
        rightKnee,
        leftAnkle,
        rightAnkle,
        leftShoulder,
        rightShoulder,
      })

    default:
      return {
        score: 50,
        feedback: "Exercise analysis not available for this exercise type.",
        suggestions: ["Please select a supported exercise type."],
      }
  }
}

function analyzeSquat(landmarks: any) {
  const { leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle } = landmarks

  if (!leftHip || !rightHip || !leftKnee || !rightKnee) {
    return {
      score: 30,
      feedback: "Unable to detect key landmarks for squat analysis.",
      suggestions: ["Ensure your full body is visible in the camera frame."],
    }
  }

  let score = 100
  const suggestions: string[] = []

  // Check knee alignment
  const kneeHipAlignment = Math.abs(leftKnee.x - leftHip.x) + Math.abs(rightKnee.x - rightHip.x)
  if (kneeHipAlignment > 0.1) {
    score -= 20
    suggestions.push("Keep your knees aligned with your hips.")
  }

  // Check depth
  const hipKneeDistance = Math.abs(leftHip.y - leftKnee.y)
  if (hipKneeDistance < 0.1) {
    score -= 15
    suggestions.push("Try to squat deeper - aim to get your hips below knee level.")
  }

  // Check balance
  const leftRightBalance = Math.abs(leftKnee.y - rightKnee.y)
  if (leftRightBalance > 0.05) {
    score -= 10
    suggestions.push("Maintain equal weight distribution on both legs.")
  }

  let feedback = ""
  if (score >= 85) {
    feedback = "Excellent squat form! Your alignment and depth are spot on."
  } else if (score >= 70) {
    feedback = "Good squat form with room for minor improvements."
  } else if (score >= 50) {
    feedback = "Your squat form needs some adjustments for better results."
  } else {
    feedback = "Focus on the basics - proper alignment and controlled movement."
  }

  return { score: Math.max(0, score), feedback, suggestions }
}

function analyzePushup(landmarks: any) {
  const { leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist, leftHip, rightHip } = landmarks

  if (!leftShoulder || !rightShoulder || !leftElbow || !rightElbow) {
    return {
      score: 30,
      feedback: "Unable to detect key landmarks for push-up analysis.",
      suggestions: ["Ensure your upper body is clearly visible in the camera frame."],
    }
  }

  let score = 100
  const suggestions: string[] = []

  // Check body alignment (plank position)
  const shoulderHipAlignment = Math.abs((leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2)
  if (shoulderHipAlignment > 0.15) {
    score -= 25
    suggestions.push("Keep your body in a straight line from head to heels.")
  }

  // Check arm position
  const elbowShoulderAlignment = Math.abs(leftElbow.x - leftShoulder.x) + Math.abs(rightElbow.x - rightShoulder.x)
  if (elbowShoulderAlignment > 0.2) {
    score -= 20
    suggestions.push("Keep your elbows closer to your body, not flared out wide.")
  }

  // Check hand position
  if (leftWrist && rightWrist) {
    const wristShoulderAlignment = Math.abs(leftWrist.x - leftShoulder.x) + Math.abs(rightWrist.x - rightShoulder.x)
    if (wristShoulderAlignment > 0.1) {
      score -= 15
      suggestions.push("Position your hands directly under your shoulders.")
    }
  }

  let feedback = ""
  if (score >= 85) {
    feedback = "Perfect push-up form! Your body alignment and arm position are excellent."
  } else if (score >= 70) {
    feedback = "Solid push-up technique with minor areas for improvement."
  } else if (score >= 50) {
    feedback = "Your push-up form has some issues that need attention."
  } else {
    feedback = "Focus on maintaining proper body alignment throughout the movement."
  }

  return { score: Math.max(0, score), feedback, suggestions }
}

function analyzePlank(landmarks: any) {
  const { leftShoulder, rightShoulder, leftHip, rightHip, leftAnkle, rightAnkle } = landmarks

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return {
      score: 30,
      feedback: "Unable to detect key landmarks for plank analysis.",
      suggestions: ["Ensure your full body is visible in the camera frame."],
    }
  }

  let score = 100
  const suggestions: string[] = []

  // Check body alignment
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2
  const hipY = (leftHip.y + rightHip.y) / 2
  const bodyAlignment = Math.abs(shoulderY - hipY)

  if (bodyAlignment > 0.1) {
    score -= 30
    suggestions.push("Keep your body in a straight line - avoid sagging hips or raising your butt.")
  }

  // Check shoulder stability
  const shoulderLevel = Math.abs(leftShoulder.y - rightShoulder.y)
  if (shoulderLevel > 0.05) {
    score -= 15
    suggestions.push("Keep your shoulders level and stable.")
  }

  // Check hip level
  const hipLevel = Math.abs(leftHip.y - rightHip.y)
  if (hipLevel > 0.05) {
    score -= 10
    suggestions.push("Maintain level hips throughout the plank.")
  }

  let feedback = ""
  if (score >= 85) {
    feedback = "Outstanding plank form! Your body alignment is perfect."
  } else if (score >= 70) {
    feedback = "Good plank position with some minor adjustments needed."
  } else if (score >= 50) {
    feedback = "Your plank form needs improvement for maximum effectiveness."
  } else {
    feedback = "Focus on creating a straight line from head to heels."
  }

  return { score: Math.max(0, score), feedback, suggestions }
}

function analyzeLunge(landmarks: any) {
  const { leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle, leftShoulder, rightShoulder } = landmarks

  if (!leftHip || !rightHip || !leftKnee || !rightKnee) {
    return {
      score: 30,
      feedback: "Unable to detect key landmarks for lunge analysis.",
      suggestions: ["Ensure your full body is visible in the camera frame."],
    }
  }

  let score = 100
  const suggestions: string[] = []

  // Check front knee alignment
  const frontKneeAnkleAlignment = Math.abs(leftKnee.x - (leftAnkle?.x || leftKnee.x))
  if (frontKneeAnkleAlignment > 0.05) {
    score -= 20
    suggestions.push("Keep your front knee aligned over your ankle.")
  }

  // Check lunge depth
  const lungeDepth = Math.abs(leftKnee.y - rightKnee.y)
  if (lungeDepth < 0.15) {
    score -= 15
    suggestions.push("Lower into a deeper lunge position.")
  }

  // Check torso position
  const torsoAlignment = Math.abs((leftHip.y + rightHip.y) / 2 - (leftShoulder?.y || leftHip.y))
  if (torsoAlignment > 0.2) {
    score -= 20
    suggestions.push("Keep your torso upright and avoid leaning forward.")
  }

  let feedback = ""
  if (score >= 85) {
    feedback = "Excellent lunge form! Your alignment and depth are perfect."
  } else if (score >= 70) {
    feedback = "Good lunge technique with room for minor improvements."
  } else if (score >= 50) {
    feedback = "Your lunge form needs some adjustments for better results."
  } else {
    feedback = "Focus on proper knee alignment and maintaining an upright torso."
  }

  return { score: Math.max(0, score), feedback, suggestions }
}
