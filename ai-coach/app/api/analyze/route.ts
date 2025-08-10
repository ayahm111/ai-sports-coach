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
  sessionId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { exercise, pose, timestamp, sessionId } = AnalyzeRequestSchema.parse(body)

    // Analyze the pose based on ACTUAL landmark data
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
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}

function analyzePoseForExercise(exercise: string, pose: PoseData) {
  const landmarks = pose.landmarks

  // Get key landmarks with actual data
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

  // Calculate visibility score from actual data
  const visibilityScore = Math.round((landmarks.filter((l) => l.visibility > 0.5).length / landmarks.length) * 100)

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
        visibilityScore,
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
        visibilityScore,
      })

    case "plank":
      return analyzePlank({
        leftShoulder,
        rightShoulder,
        leftHip,
        rightHip,
        leftAnkle,
        rightAnkle,
        visibilityScore,
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
        visibilityScore,
      })

    default:
      return {
        score: Math.max(20, visibilityScore - 20),
        feedback: `Exercise analysis not available for ${exercise}. Based on pose visibility: ${visibilityScore}%`,
        suggestions: ["Please select a supported exercise type for detailed analysis."],
      }
  }
}

function analyzeSquat(landmarks: any) {
  const {
    leftHip,
    rightHip,
    leftKnee,
    rightKnee,
    leftAnkle,
    rightAnkle,
    leftShoulder,
    rightShoulder,
    visibilityScore,
  } = landmarks

  if (!leftHip || !rightHip || !leftKnee || !rightKnee) {
    return {
      score: Math.max(10, visibilityScore - 40),
      feedback: "Unable to detect key landmarks for squat analysis. Ensure your full body is visible.",
      suggestions: [
        "Step back from the camera to show your full body",
        "Ensure good lighting",
        "Face the camera directly",
      ],
    }
  }

  let score = 100
  const suggestions: string[] = []
  const issues: string[] = []

  // REAL DATA ANALYSIS - Check knee alignment using actual coordinates
  const leftKneeHipAlignment = Math.abs(leftKnee.x - leftHip.x)
  const rightKneeHipAlignment = Math.abs(rightKnee.x - rightHip.x)
  const avgKneeAlignment = (leftKneeHipAlignment + rightKneeHipAlignment) / 2

  if (avgKneeAlignment > 0.08) {
    score -= 25
    suggestions.push("Keep your knees aligned with your hips - they're tracking outward")
    issues.push("knee alignment")
  }

  // Check squat depth using actual Y coordinates
  const hipKneeDistance = Math.abs((leftHip.y + rightHip.y) / 2 - (leftKnee.y + rightKnee.y) / 2)
  if (hipKneeDistance < 0.08) {
    score -= 20
    suggestions.push("Squat deeper - aim to get your hips below knee level")
    issues.push("insufficient depth")
  }

  // Check balance using actual coordinates
  const leftRightBalance = Math.abs(leftKnee.y - rightKnee.y)
  if (leftRightBalance > 0.06) {
    score -= 15
    suggestions.push("Maintain equal weight distribution on both legs")
    issues.push("weight imbalance")
  }

  // Check shoulder position if available
  if (leftShoulder && rightShoulder) {
    const shoulderAlignment = Math.abs(leftShoulder.y - rightShoulder.y)
    if (shoulderAlignment > 0.05) {
      score -= 10
      suggestions.push("Keep your shoulders level and back straight")
      issues.push("shoulder misalignment")
    }
  }

  // Adjust score based on visibility
  if (visibilityScore < 80) {
    score = Math.min(score, visibilityScore + 10)
    suggestions.push("Improve camera positioning for better pose detection")
  }

  // Generate feedback based on actual analysis
  let feedback = ""
  if (score >= 90) {
    feedback = "Excellent squat form! Your knee alignment, depth, and balance are all spot-on."
  } else if (score >= 80) {
    feedback = `Good squat form! ${issues.length > 0 ? `Minor issues with ${issues.join(" and ")}.` : "Keep up the great work!"}`
  } else if (score >= 70) {
    feedback = `Decent squat form with room for improvement. Main issues: ${issues.join(", ")}.`
  } else if (score >= 50) {
    feedback = `Your squat needs work. Focus on: ${issues.join(", ")}.`
  } else {
    feedback = `Let's work on squat basics. Major issues detected: ${issues.join(", ")}.`
  }

  return {
    score: Math.max(0, Math.round(score)),
    feedback,
    suggestions: suggestions.slice(0, 3), // Limit to top 3 suggestions
  }
}

function analyzePushup(landmarks: any) {
  const {
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    leftWrist,
    rightWrist,
    leftHip,
    rightHip,
    visibilityScore,
  } = landmarks

  if (!leftShoulder || !rightShoulder || !leftElbow || !rightElbow) {
    return {
      score: Math.max(10, visibilityScore - 40),
      feedback: "Unable to detect key upper body landmarks for push-up analysis.",
      suggestions: [
        "Ensure your upper body is clearly visible",
        "Improve lighting",
        "Position camera to show your full torso",
      ],
    }
  }

  let score = 100
  const suggestions: string[] = []
  const issues: string[] = []

  // Check body alignment (plank position) using real coordinates
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2
  const hipY = leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : shoulderY
  const bodyAlignment = Math.abs(shoulderY - hipY)

  if (bodyAlignment > 0.12) {
    score -= 30
    suggestions.push("Keep your body in a straight line from head to heels")
    issues.push("body alignment")
  }

  // Check arm position using actual elbow coordinates
  const leftElbowShoulderDist = Math.abs(leftElbow.x - leftShoulder.x)
  const rightElbowShoulderDist = Math.abs(rightElbow.x - rightShoulder.x)
  const avgElbowPosition = (leftElbowShoulderDist + rightElbowShoulderDist) / 2

  if (avgElbowPosition > 0.15) {
    score -= 25
    suggestions.push("Keep your elbows closer to your body, not flared out wide")
    issues.push("elbow position")
  }

  // Check hand position if wrists are visible
  if (leftWrist && rightWrist) {
    const leftWristShoulderAlign = Math.abs(leftWrist.x - leftShoulder.x)
    const rightWristShoulderAlign = Math.abs(rightWrist.x - rightShoulder.x)
    const avgWristAlignment = (leftWristShoulderAlign + rightWristShoulderAlign) / 2

    if (avgWristAlignment > 0.08) {
      score -= 15
      suggestions.push("Position your hands directly under your shoulders")
      issues.push("hand placement")
    }
  }

  // Check shoulder level
  const shoulderLevel = Math.abs(leftShoulder.y - rightShoulder.y)
  if (shoulderLevel > 0.06) {
    score -= 10
    suggestions.push("Keep your shoulders level")
    issues.push("shoulder level")
  }

  // Adjust for visibility
  if (visibilityScore < 75) {
    score = Math.min(score, visibilityScore + 15)
    suggestions.push("Adjust camera angle for better upper body visibility")
  }

  let feedback = ""
  if (score >= 90) {
    feedback = "Perfect push-up form! Your body alignment and arm position are excellent."
  } else if (score >= 80) {
    feedback = `Solid push-up technique! ${issues.length > 0 ? `Minor adjustments needed for ${issues.join(" and ")}.` : ""}`
  } else if (score >= 70) {
    feedback = `Good push-up effort! Work on: ${issues.join(", ")}.`
  } else if (score >= 50) {
    feedback = `Your push-up form needs attention. Focus on: ${issues.join(", ")}.`
  } else {
    feedback = `Let's work on push-up basics. Major issues: ${issues.join(", ")}.`
  }

  return {
    score: Math.max(0, Math.round(score)),
    feedback,
    suggestions: suggestions.slice(0, 3),
  }
}

function analyzePlank(landmarks: any) {
  const { leftShoulder, rightShoulder, leftHip, rightHip, leftAnkle, rightAnkle, visibilityScore } = landmarks

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return {
      score: Math.max(10, visibilityScore - 40),
      feedback: "Unable to detect key landmarks for plank analysis.",
      suggestions: [
        "Ensure your full body profile is visible",
        "Position camera to show side view",
        "Improve lighting",
      ],
    }
  }

  let score = 100
  const suggestions: string[] = []
  const issues: string[] = []

  // Check body alignment using real coordinates
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2
  const hipY = (leftHip.y + rightHip.y) / 2
  const bodyAlignment = Math.abs(shoulderY - hipY)

  if (bodyAlignment > 0.08) {
    score -= 35
    if (shoulderY > hipY) {
      suggestions.push("Lift your hips up - avoid sagging")
      issues.push("hip sagging")
    } else {
      suggestions.push("Lower your hips - avoid piking up")
      issues.push("hip piking")
    }
  }

  // Check shoulder stability
  const shoulderLevel = Math.abs(leftShoulder.y - rightShoulder.y)
  if (shoulderLevel > 0.04) {
    score -= 15
    suggestions.push("Keep your shoulders level and stable")
    issues.push("shoulder instability")
  }

  // Check hip level
  const hipLevel = Math.abs(leftHip.y - rightHip.y)
  if (hipLevel > 0.04) {
    score -= 10
    suggestions.push("Maintain level hips throughout the plank")
    issues.push("hip misalignment")
  }

  // If ankles are visible, check leg alignment
  if (leftAnkle && rightAnkle) {
    const ankleLevel = Math.abs(leftAnkle.y - rightAnkle.y)
    if (ankleLevel > 0.05) {
      score -= 10
      suggestions.push("Keep your legs straight and feet together")
      issues.push("leg alignment")
    }
  }

  // Adjust for visibility
  if (visibilityScore < 70) {
    score = Math.min(score, visibilityScore + 20)
    suggestions.push("Position camera for better side profile view")
  }

  let feedback = ""
  if (score >= 90) {
    feedback = "Outstanding plank form! Your body alignment is perfect."
  } else if (score >= 80) {
    feedback = `Excellent plank! ${issues.length > 0 ? `Minor adjustments: ${issues.join(", ")}.` : ""}`
  } else if (score >= 70) {
    feedback = `Good plank position. Work on: ${issues.join(", ")}.`
  } else if (score >= 50) {
    feedback = `Your plank needs improvement. Focus on: ${issues.join(", ")}.`
  } else {
    feedback = `Let's work on plank basics. Issues detected: ${issues.join(", ")}.`
  }

  return {
    score: Math.max(0, Math.round(score)),
    feedback,
    suggestions: suggestions.slice(0, 3),
  }
}

function analyzeLunge(landmarks: any) {
  const {
    leftHip,
    rightHip,
    leftKnee,
    rightKnee,
    leftAnkle,
    rightAnkle,
    leftShoulder,
    rightShoulder,
    visibilityScore,
  } = landmarks

  if (!leftHip || !rightHip || !leftKnee || !rightKnee) {
    return {
      score: Math.max(10, visibilityScore - 40),
      feedback: "Unable to detect key landmarks for lunge analysis.",
      suggestions: ["Ensure your full body is visible", "Step back from camera", "Face the camera directly"],
    }
  }

  let score = 100
  const suggestions: string[] = []
  const issues: string[] = []

  // Determine which leg is forward based on knee positions
  const frontKnee = leftKnee.y > rightKnee.y ? leftKnee : rightKnee
  const backKnee = leftKnee.y > rightKnee.y ? rightKnee : leftKnee
  const frontAnkle = leftKnee.y > rightKnee.y ? leftAnkle : rightAnkle

  // Check front knee alignment with ankle
  if (frontAnkle) {
    const kneeAnkleAlignment = Math.abs(frontKnee.x - frontAnkle.x)
    if (kneeAnkleAlignment > 0.06) {
      score -= 25
      suggestions.push("Keep your front knee aligned over your ankle")
      issues.push("front knee alignment")
    }
  }

  // Check lunge depth
  const lungeDepth = Math.abs(frontKnee.y - backKnee.y)
  if (lungeDepth < 0.12) {
    score -= 20
    suggestions.push("Lower into a deeper lunge position")
    issues.push("insufficient depth")
  }

  // Check torso position if shoulders are visible
  if (leftShoulder && rightShoulder) {
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2
    const hipY = (leftHip.y + rightHip.y) / 2
    const torsoLean = Math.abs(shoulderY - hipY)

    if (torsoLean > 0.15) {
      score -= 20
      suggestions.push("Keep your torso upright and avoid leaning forward")
      issues.push("torso lean")
    }

    // Check shoulder level
    const shoulderLevel = Math.abs(leftShoulder.y - rightShoulder.y)
    if (shoulderLevel > 0.05) {
      score -= 10
      suggestions.push("Keep your shoulders level")
      issues.push("shoulder tilt")
    }
  }

  // Check hip alignment
  const hipLevel = Math.abs(leftHip.y - rightHip.y)
  if (hipLevel > 0.08) {
    score -= 15
    suggestions.push("Keep your hips square and level")
    issues.push("hip misalignment")
  }

  // Adjust for visibility
  if (visibilityScore < 75) {
    score = Math.min(score, visibilityScore + 10)
    suggestions.push("Improve camera positioning for full body visibility")
  }

  let feedback = ""
  if (score >= 90) {
    feedback = "Excellent lunge form! Your alignment and depth are perfect."
  } else if (score >= 80) {
    feedback = `Great lunge technique! ${issues.length > 0 ? `Minor improvements: ${issues.join(", ")}.` : ""}`
  } else if (score >= 70) {
    feedback = `Good lunge form. Focus on: ${issues.join(", ")}.`
  } else if (score >= 50) {
    feedback = `Your lunge needs work. Address: ${issues.join(", ")}.`
  } else {
    feedback = `Let's work on lunge fundamentals. Issues: ${issues.join(", ")}.`
  }

  return {
    score: Math.max(0, Math.round(score)),
    feedback,
    suggestions: suggestions.slice(0, 3),
  }
}
