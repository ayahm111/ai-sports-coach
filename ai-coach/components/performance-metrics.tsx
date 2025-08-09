"use client";

import { useState, useEffect } from "react"
import { TrendingUp, Target, Clock, Flame, Heart, Award } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { WorkoutSession } from "@/lib/types"

interface PerformanceMetricsProps {
  workoutSession: WorkoutSession | null
}

export default function PerformanceMetrics({ workoutSession }: PerformanceMetricsProps) {
  const [weeklyData, setWeeklyData] = useState([
    { day: "Mon", score: 75, duration: 45, calories: 320 },
    { day: "Tue", score: 82, duration: 38, calories: 280 },
    { day: "Wed", score: 78, duration: 52, calories: 380 },
    { day: "Thu", score: 85, duration: 41, calories: 310 },
    { day: "Fri", score: 88, duration: 47, calories: 350 },
    { day: "Sat", score: 92, duration: 55, calories: 420 },
    { day: "Sun", score: 79, duration: 35, calories: 260 },
  ])

  const [personalBests, setPersonalBests] = useState({
    squat: { score: 95, date: "2024-01-15" },
    pushup: { score: 88, date: "2024-01-12" },
    plank: { score: 92, date: "2024-01-18" },
    lunge: { score: 85, date: "2024-01-10" },
  })

  const [currentStats, setCurrentStats] = useState({
    totalWorkouts: 24,
    averageScore: 83,
    totalDuration: 18.5, // hours
    caloriesBurned: 7840,
    streak: 7,
    improvements: 15,
  })

  // Simulate real-time heart rate data
  const [heartRateData, setHeartRateData] = useState([
    { time: "0:00", bpm: 72 },
    { time: "0:30", bpm: 85 },
    { time: "1:00", bpm: 92 },
    { time: "1:30", bpm: 98 },
    { time: "2:00", bpm: 105 },
    { time: "2:30", bpm: 110 },
    { time: "3:00", bpm: 108 },
  ])

  useEffect(() => {
    // Simulate real-time updates during workout
    if (workoutSession) {
      const interval = setInterval(() => {
        setHeartRateData((prev) => [
          ...prev.slice(-6),
          {
            time: new Date().toLocaleTimeString().slice(0, 5),
            bpm: 90 + Math.floor(Math.random() * 30),
          },
        ])
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [workoutSession])

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Good"
    if (score >= 70) return "Fair"
    return "Needs Work"
  }

  return (
    <div className="space-y-6">
      {/* Current Session Stats */}
      {workoutSession && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-xl font-bold">
                    {Math.floor((Date.now() - workoutSession.startTime.getTime()) / 60000)}m
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Calories</p>
                  <p className="text-xl font-bold">{workoutSession.caloriesBurned || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg HR</p>
                  <p className="text-xl font-bold">{workoutSession.averageHeartRate || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Exercises</p>
                  <p className="text-xl font-bold">{workoutSession.exercises.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Heart Rate Monitor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Heart Rate Monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={heartRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[60, 140]} />
                <Tooltip />
                <Line type="monotone" dataKey="bpm" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Personal Bests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Personal Bests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(personalBests).map(([exercise, data]) => (
                <div key={exercise} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{exercise}</p>
                    <p className="text-sm text-gray-600">{data.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getScoreColor(data.score)}`}>{data.score}%</p>
                    <Badge variant="outline" className="text-xs">
                      {getScoreBadge(data.score)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Overall Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Workouts</span>
                <span className="text-lg font-bold">{currentStats.totalWorkouts}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Score</span>
                  <span className="text-lg font-bold">{currentStats.averageScore}%</span>
                </div>
                <Progress value={currentStats.averageScore} className="h-2" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Duration</span>
                <span className="text-lg font-bold">{currentStats.totalDuration}h</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calories Burned</span>
                <span className="text-lg font-bold">{currentStats.caloriesBurned.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Streak</span>
                <Badge variant="default">{currentStats.streak} days</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Form Improvements</span>
                <Badge variant="secondary">+{currentStats.improvements}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
