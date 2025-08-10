"use client"

import { useState } from "react"
import { Target, Calendar, TrendingUp, CheckCircle, Clock, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AnalysisResult } from "@/lib/types"

interface TrainingPlanProps {
  currentPerformance: AnalysisResult | null
}

interface WorkoutPlan {
  id: string
  name: string
  description: string
  duration: number
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  exercises: {
    name: string
    sets: number
    reps: number
    restTime: number
    focusAreas: string[]
  }[]
  completed: boolean
}

export default function TrainingPlan({ currentPerformance }: TrainingPlanProps) {
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [activeTab, setActiveTab] = useState("current")

  const weeklyPlans: Record<number, WorkoutPlan[]> = {
    1: [
      {
        id: "w1d1",
        name: "Foundation Building",
        description: "Focus on basic movement patterns and form",
        duration: 30,
        difficulty: "Beginner",
        exercises: [
          { name: "Bodyweight Squat", sets: 3, reps: 12, restTime: 60, focusAreas: ["Lower Body", "Form"] },
          { name: "Push-up (Modified)", sets: 3, reps: 8, restTime: 60, focusAreas: ["Upper Body", "Core"] },
          { name: "Plank Hold", sets: 3, reps: 30, restTime: 45, focusAreas: ["Core", "Stability"] },
        ],
        completed: true,
      },
      {
        id: "w1d2",
        name: "Movement Quality",
        description: "Improve coordination and balance",
        duration: 35,
        difficulty: "Beginner",
        exercises: [
          { name: "Lunge (Alternating)", sets: 3, reps: 10, restTime: 60, focusAreas: ["Balance", "Lower Body"] },
          { name: "Wall Push-up", sets: 3, reps: 12, restTime: 45, focusAreas: ["Upper Body", "Form"] },
          { name: "Dead Bug", sets: 3, reps: 8, restTime: 45, focusAreas: ["Core", "Coordination"] },
        ],
        completed: false,
      },
    ],
    2: [
      {
        id: "w2d1",
        name: "Strength Building",
        description: "Increase resistance and challenge",
        duration: 40,
        difficulty: "Intermediate",
        exercises: [
          { name: "Goblet Squat", sets: 4, reps: 12, restTime: 75, focusAreas: ["Lower Body", "Strength"] },
          { name: "Standard Push-up", sets: 3, reps: 10, restTime: 60, focusAreas: ["Upper Body", "Power"] },
          { name: "Side Plank", sets: 3, reps: 20, restTime: 60, focusAreas: ["Core", "Stability"] },
        ],
        completed: false,
      },
    ],
  }

  const personalizedRecommendations = [
    {
      title: "Form Focus",
      description: "Based on your recent squat analysis, focus on knee alignment",
      priority: "High",
      exercises: ["Goblet Squat", "Wall Sit", "Glute Bridge"],
    },
    {
      title: "Strength Building",
      description: "Your push-up form is excellent! Time to increase difficulty",
      priority: "Medium",
      exercises: ["Diamond Push-up", "Decline Push-up", "Pike Push-up"],
    },
    {
      title: "Flexibility Work",
      description: "Add mobility work to improve your range of motion",
      priority: "Medium",
      exercises: ["Hip Flexor Stretch", "Shoulder Rolls", "Cat-Cow Stretch"],
    },
  ]

  const goals = [
    { name: "Perfect Squat Form", progress: 75, target: "90% consistency", deadline: "2 weeks" },
    { name: "20 Consecutive Push-ups", progress: 60, target: "20 reps", deadline: "4 weeks" },
    { name: "2-minute Plank Hold", progress: 45, target: "120 seconds", deadline: "6 weeks" },
    { name: "Single-leg Lunge", progress: 30, target: "10 per leg", deadline: "8 weeks" },
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Plan</TabsTrigger>
          <TabsTrigger value="goals">Goals & Progress</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Week Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Training Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4].map((week) => (
                  <Button
                    key={week}
                    variant={selectedWeek === week ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedWeek(week)}
                  >
                    Week {week}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Workouts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {weeklyPlans[selectedWeek]?.map((workout) => (
              <Card key={workout.id} className={workout.completed ? "border-green-200 bg-green-50" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{workout.name}</CardTitle>
                    {workout.completed && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                  <p className="text-sm text-gray-600">{workout.description}</p>
                  <div className="flex gap-2">
                    <Badge className={getDifficultyColor(workout.difficulty)}>{workout.difficulty}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {workout.duration}min
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workout.exercises.map((exercise, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{exercise.name}</h4>
                          <div className="text-sm text-gray-600">
                            {exercise.sets}×{exercise.reps} • {exercise.restTime}s rest
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {exercise.focusAreas.map((area) => (
                            <Badge key={area} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" disabled={workout.completed}>
                    {workout.completed ? "Completed" : "Start Workout"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Fitness Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {goals.map((goal, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{goal.name}</h4>
                      <Badge variant="outline">{goal.deadline}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Target: {goal.target}</span>
                      <span>{goal.progress}% complete</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI-Powered Recommendations
              </CardTitle>
              {currentPerformance && (
                <p className="text-sm text-gray-600">
                  Based on your recent {currentPerformance.exercise} performance (Score: {currentPerformance.score}%)
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {personalizedRecommendations.map((rec, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{rec.title}</h4>
                        <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                      <div className="flex gap-1 flex-wrap">
                        {rec.exercises.map((exercise) => (
                          <Badge key={exercise} variant="outline" className="text-xs">
                            {exercise}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Adjustments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Dynamic Plan Adjustments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Intensity Adjustment</h4>
                  <p className="text-sm text-blue-800">
                    Your recent performance shows consistent improvement. Consider increasing workout intensity by 10%.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Recovery Optimization</h4>
                  <p className="text-sm text-green-800">
                    Great job maintaining form quality! Add one extra rest day this week to optimize recovery.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Skill Development</h4>
                  <p className="text-sm text-yellow-800">
                    Ready for new challenges? Try adding single-arm push-ups to your routine next week.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
