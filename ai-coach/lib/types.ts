export interface Exercise {
  id: string
  name: string
  description: string
  targetReps: number
  targetSets: number
}

export interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility: number
  name: string
}

export interface PoseData {
  landmarks: PoseLandmark[]
  timestamp: number
}

export interface AnalysisResult {
  exercise: string
  score: number
  feedback: string
  suggestions: string[]
  timestamp: number
}

export interface WorkoutSession {
  id: string
  startTime: Date
  exercises: {
    exerciseId: string
    reps: number
    sets: number
    score: number
    timestamp: number
  }[]
  totalDuration: number
  caloriesBurned: number
  averageHeartRate: number
}

export interface SpeechRequest {
  text: string
  persona?: "motivational" | "analytical" | "supportive"
}

export interface AnalyzeRequest {
  exercise: string
  pose: PoseData
  timestamp: number
  sessionId?: string
}

export interface AgentMessage {
  id: string
  content: string
  type: "user" | "agent"
  category: "feedback" | "motivation" | "instruction" | "question"
  timestamp: Date
}
