"use client";

import { Camera, Mic, MicOff, Play, Square, Activity, Target, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import WebcamFeed from "@/components/webcam-feed"
import ConversationalAgent from "@/components/conversational-agent"
import PerformanceMetrics from "@/components/performance-metrics"
import TrainingPlan from "@/components/training-plan"
import type { Exercise, PoseData, AnalysisResult, WorkoutSession } from "@/lib/types"
// In your page.tsx
import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";


const EXERCISES: Exercise[] = [
  { id: "squat", name: "Squat", description: "Lower body strength exercise", targetReps: 12, targetSets: 3 },
  { id: "pushup", name: "Push-up", description: "Upper body strength exercise", targetReps: 15, targetSets: 3 },
  { id: "plank", name: "Plank", description: "Core stability exercise", targetReps: 1, targetSets: 3 },
  { id: "lunge", name: "Lunge", description: "Lower body balance exercise", targetReps: 10, targetSets: 3 },
  { id: "burpee", name: "Burpee", description: "Full body cardio exercise", targetReps: 8, targetSets: 3 },
]

export default function HomePage() {
  const [selectedExercise, setSelectedExercise] = useState<string>("")
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [currentPose, setCurrentPose] = useState<PoseData | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string>("")
  const [activeTab, setActiveTab] = useState("workout")
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null)
  const [isAgentActive, setIsAgentActive] = useState(false)
  const WebcamFeed = dynamic(
    () => import('@/components/webcam-feed'),
    { ssr: false }
  );
  const [isElevenLabsReady, setIsElevenLabsReady] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY) {
      setIsElevenLabsReady(true);
    }
  }, []);

  // Initialize workout session
  useEffect(() => {
    const session: WorkoutSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      exercises: [],
      totalDuration: 0,
      caloriesBurned: 0,
      averageHeartRate: 0,
    }
    setWorkoutSession(session)
  }, [])

  const handleStartRecording = () => {
    if (!selectedExercise) {
      setError("Please select an exercise first")
      return
    }
    setError("")
    setIsRecording(true)
    setAnalysisResult(null)
    setIsAgentActive(true)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    setIsAgentActive(false)
  }

  const handlePoseDetected = (pose: PoseData) => {
    setCurrentPose(pose)
    if (isRecording && selectedExercise) {
      analyzePose(pose)
    }
  }

  const analyzePose = async (pose: PoseData) => {
    if (isAnalyzing) return

    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exercise: selectedExercise,
          pose: pose,
          timestamp: Date.now(),
          sessionId: workoutSession?.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const result: AnalysisResult = await response.json()
      setAnalysisResult(result)

      // Update workout session
      if (workoutSession) {
        const updatedSession = {
          ...workoutSession,
          exercises: [
            ...workoutSession.exercises,
            {
              exerciseId: selectedExercise,
              reps: 1,
              sets: 1,
              score: result.score,
              timestamp: Date.now(),
            },
          ],
        }
        setWorkoutSession(updatedSession)
      }
    } catch (err) {
      setError("Failed to analyze pose")
      console.error("Analysis error:", err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAgentMessage = (message: string, type: "feedback" | "motivation" | "instruction") => {
    // Handle different types of agent messages
    console.log(`Agent ${type}:`, message)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Sports Coach</h1>
          <p className="text-lg text-gray-600">Conversational performance insights powered by ElevenLabs</p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="outline" className="bg-blue-50">
              Real-time Analysis
            </Badge>
            <Badge variant="outline" className="bg-green-50">
              Voice Coaching
            </Badge>
            <Badge variant="outline" className="bg-purple-50">
              Personalized Training
            </Badge>
          </div>
        </header>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workout" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Workout
            </TabsTrigger>
            <TabsTrigger value="coach" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              AI Coach
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Training Plan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workout" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Control Panel */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Exercise Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Exercise</label>
                    <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an exercise" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXERCISES.map((exercise) => (
                          <SelectItem key={exercise.id} value={exercise.id}>
                            <div>
                              <div className="font-medium">{exercise.name}</div>
                              <div className="text-sm text-gray-500">{exercise.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Voice Coaching</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className="flex items-center gap-2"
                    >
                      {voiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      {voiceEnabled ? "On" : "Off"}
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    {!isRecording ? (
                      <Button onClick={handleStartRecording} className="w-full" disabled={!selectedExercise}>
                        <Play className="h-4 w-4 mr-2" />
                        Start Workout
                      </Button>
                    ) : (
                      <Button onClick={handleStopRecording} variant="destructive" className="w-full">
                        <Square className="h-4 w-4 mr-2" />
                        Stop Workout
                      </Button>
                    )}
                  </div>

                  {isRecording && (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Workout in progress
                    </div>
                  )}

                  {selectedExercise && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Exercise Info</h4>
                      {(() => {
                        const exercise = EXERCISES.find((e) => e.id === selectedExercise)
                        return exercise ? (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              Target: {exercise.targetSets} sets × {exercise.targetReps} reps
                            </p>
                            <p>{exercise.description}</p>
                          </div>
                        ) : null
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Webcam Feed */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Live Form Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <WebcamFeed onPoseDetected={handlePoseDetected} isActive={isRecording} />
                </CardContent>
              </Card>

              {/* Real-time Feedback */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>AI Feedback & Coaching</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            analysisResult.score >= 80
                              ? "default"
                              : analysisResult.score >= 60
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          Form Score: {analysisResult.score}/100
                        </Badge>
                        <Badge variant="outline">{analysisResult.exercise}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Real-time Feedback:</h4>
                          <p className="text-gray-700">{analysisResult.feedback}</p>
                        </div>

                        {analysisResult.suggestions.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Improvement Tips:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                              {analysisResult.suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      {isRecording ? "Analyzing your form..." : "Start a workout to get AI feedback"}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="coach">
            <ConversationalAgent
              isActive={isAgentActive && isElevenLabsReady}
              currentExercise={selectedExercise}
              analysisResult={analysisResult}
              onMessage={handleAgentMessage}
            />
          </TabsContent>

          <TabsContent value="metrics">
            <PerformanceMetrics workoutSession={workoutSession} />
          </TabsContent>

          <TabsContent value="plan">
            <TrainingPlan currentPerformance={analysisResult} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
