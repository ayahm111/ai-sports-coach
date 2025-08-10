"use client"

import { useState, useEffect } from "react"
import { Camera, Mic, MicOff, Play, Square, Activity, Target, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import WebcamFeed from "@/components/webcam-feed"
import ConversationalAgent from "@/components/conversational-agent"
import PerformanceMetrics from "@/components/performance-metrics"
import TrainingPlan from "@/components/training-plan"
import type { Exercise, PoseData, AnalysisResult, WorkoutSession } from "@/lib/types"

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
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([])

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
    setRecentAnalyses([]) // Clear previous analyses
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    setIsAgentActive(false)
  }

  const handlePoseDetected = (pose: PoseData) => {
    setCurrentPose(pose)
    if (isRecording && selectedExercise) {
      // Only analyze every 10th pose to avoid overwhelming the system
      if (pose.timestamp % 1000 < 100) {
        // Roughly every second
        analyzePose(pose)
      }
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

      // Store recent analyses for trend analysis
      setRecentAnalyses((prev) => {
        const updated = [...prev, result].slice(-10) // Keep last 10 analyses
        return updated
      })

      // Update workout session with real analysis data
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
          caloriesBurned: workoutSession.caloriesBurned + Math.round(result.score / 10), // Calories based on form quality
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
    console.log(`Agent ${type}:`, message)
  }

  // Calculate performance trends from recent analyses
  const getPerformanceTrend = () => {
    if (recentAnalyses.length < 3) return null

    const recent = recentAnalyses.slice(-3)
    const older = recentAnalyses.slice(-6, -3)

    if (older.length === 0) return null

    const recentAvg = recent.reduce((sum, a) => sum + a.score, 0) / recent.length
    const olderAvg = older.reduce((sum, a) => sum + a.score, 0) / older.length

    return recentAvg - olderAvg
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Sports Coach</h1>
          <p className="text-lg text-gray-600">Real-time form analysis with intelligent coaching</p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="outline" className="bg-blue-50">
              Live Camera Analysis
            </Badge>
            <Badge variant="outline" className="bg-green-50">
              AI Voice Coaching
            </Badge>
            <Badge variant="outline" className="bg-purple-50">
              Real-time Feedback
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
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Workout in progress
                      </div>
                      {recentAnalyses.length > 0 && (
                        <div className="text-xs text-gray-600 text-center">
                          {recentAnalyses.length} analyses completed
                        </div>
                      )}
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

                  {/* Performance Trend Indicator */}
                  {getPerformanceTrend() !== null && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Performance Trend</h4>
                      <div className={`text-sm ${getPerformanceTrend()! > 0 ? "text-green-600" : "text-red-600"}`}>
                        {getPerformanceTrend()! > 0 ? "↗️ Improving" : "↘️ Declining"}(
                        {Math.abs(getPerformanceTrend()!).toFixed(1)} points)
                      </div>
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
                        <Badge variant="outline" className="text-xs">
                          {new Date(analysisResult.timestamp).toLocaleTimeString()}
                        </Badge>
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

                      {/* Recent Performance Summary */}
                      {recentAnalyses.length > 1 && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2">Session Summary:</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Average Score:</span>
                              <div className="font-bold">
                                {Math.round(
                                  recentAnalyses.reduce((sum, a) => sum + a.score, 0) / recentAnalyses.length,
                                )}
                                %
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Best Score:</span>
                              <div className="font-bold text-green-600">
                                {Math.max(...recentAnalyses.map((a) => a.score))}%
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Analyses:</span>
                              <div className="font-bold">{recentAnalyses.length}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      {isRecording ? (
                        <div>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                          <p>Analyzing your form...</p>
                          <p className="text-sm mt-1">Move and perform the exercise to get feedback</p>
                        </div>
                      ) : (
                        "Start a workout to get AI feedback based on your actual form"
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="coach">
            <ConversationalAgent
              isActive={isAgentActive}
              currentExercise={selectedExercise}
              analysisResult={analysisResult}
              recentAnalyses={recentAnalyses}
              performanceTrend={getPerformanceTrend()}
              onMessage={handleAgentMessage}
            />
          </TabsContent>

          <TabsContent value="metrics">
            <PerformanceMetrics workoutSession={workoutSession} recentAnalyses={recentAnalyses} />
          </TabsContent>

          <TabsContent value="plan">
            <TrainingPlan currentPerformance={analysisResult} recentAnalyses={recentAnalyses} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
