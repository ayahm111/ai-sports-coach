import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const AnalysisRequestSchema = z.object({
  exercise: z.string().min(1),
  pose: z.object({
    landmarks: z.array(
      z.object({
        x: z.number(),
        y: z.number(),
        z: z.number().optional(),
        visibility: z.number().optional(),
        name: z.string().optional(),
      })
    ),
    timestamp: z.number(),
  }),
  sessionId: z.string().optional(),
  voiceEnabled: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exercise, pose, voiceEnabled } = AnalysisRequestSchema.parse(body);

    // Simple analysis logic - replace with your actual pose analysis algorithm
    const score = analyzeExercisePose(exercise, pose.landmarks);
    
    const feedback = generateFeedback(exercise, score);
    const suggestions = generateSuggestions(exercise, score);

    return NextResponse.json({
      exercise,
      score,
      feedback,
      suggestions,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error("Analysis error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to analyze pose" },
      { status: 500 }
    );
  }
}

// Helper functions for pose analysis
function analyzeExercisePose(exercise: string, landmarks: any[]): number {
  // Basic scoring based on visible landmarks
  const visibleLandmarks = landmarks.filter(l => l.visibility > 0.5);
  const visibilityScore = (visibleLandmarks.length / landmarks.length) * 100;

  // Exercise-specific scoring
  let exerciseScore = 50; // Base score
  
  switch (exercise.toLowerCase()) {
    case 'squat':
      exerciseScore = analyzeSquat(landmarks);
      break;
    case 'pushup':
      exerciseScore = analyzePushup(landmarks);
      break;
    // Add other exercises...
    default:
      exerciseScore = visibilityScore * 0.8; // Default scoring
  }

  return Math.min(100, Math.round(exerciseScore));
}

function analyzeSquat(landmarks: any[]): number {
  // Simple squat analysis - check knee alignment
  const leftKnee = landmarks.find(l => l.name === 'left_knee');
  const rightKnee = landmarks.find(l => l.name === 'right_knee');
  const leftAnkle = landmarks.find(l => l.name === 'left_ankle');
  const rightAnkle = landmarks.find(l => l.name === 'right_ankle');

  if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle) return 50;

  // Check if knees are tracking over ankles
  const leftAlignment = Math.abs(leftKnee.x - leftAnkle.x);
  const rightAlignment = Math.abs(rightKnee.x - rightAnkle.x);
  
  // Score based on alignment (lower difference = better)
  const alignmentScore = 100 - (leftAlignment + rightAlignment) * 100;
  return Math.max(50, Math.round(alignmentScore));
}

function analyzePushup(landmarks: any[]): number {
  // Simple pushup analysis - check body alignment
  const leftShoulder = landmarks.find(l => l.name === 'left_shoulder');
  const rightShoulder = landmarks.find(l => l.name === 'right_shoulder');
  const leftHip = landmarks.find(l => l.name === 'left_hip');
  const rightHip = landmarks.find(l => l.name === 'right_hip');

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 50;

  // Check if body is straight (shoulders and hips aligned)
  const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  const hipDiff = Math.abs(leftHip.y - rightHip.y);
  
  // Score based on alignment (lower difference = better)
  const alignmentScore = 100 - (shoulderDiff + hipDiff) * 500;
  return Math.max(50, Math.round(alignmentScore));
}

function generateFeedback(exercise: string, score: number): string {
  if (score >= 85) {
    return `Excellent ${exercise} form! Maintain this technique.`;
  } else if (score >= 70) {
    return `Good ${exercise} form with minor areas for improvement.`;
  } else if (score >= 50) {
    return `Your ${exercise} form needs work. Focus on proper technique.`;
  }
  return `Poor ${exercise} form detected. Please adjust your position.`;
}

function generateSuggestions(exercise: string, score: number): string[] {
  const suggestions: string[] = [];
  
  if (score < 70) {
    switch (exercise.toLowerCase()) {
      case 'squat':
        suggestions.push("Keep your knees aligned with your toes");
        suggestions.push("Maintain a straight back throughout the movement");
        if (score < 50) {
          suggestions.push("Go deeper into your squat if possible");
        }
        break;
      case 'pushup':
        suggestions.push("Keep your body in a straight line from head to heels");
        suggestions.push("Lower your chest all the way to the ground");
        if (score < 50) {
          suggestions.push("Engage your core more throughout the movement");
        }
        break;
    }
  }

  if (suggestions.length === 0) {
    suggestions.push("Keep up the good work!");
  }

  return suggestions;
}