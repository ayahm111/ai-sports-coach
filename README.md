# AI Sports Coach - Real-time Form Analysis with Voice Feedback


## Overview

AI Sports Coach is an innovative fitness application that provides real-time form analysis and personalized voice coaching during workouts. Using computer vision for pose detection and ElevenLabs' conversational AI, the app offers immediate feedback on exercise technique, helping users improve their form and prevent injuries.

## Key Features

- **Real-time Pose Analysis**: Camera-based tracking of body landmarks during exercises
- **AI Voice Coaching**: Natural language feedback powered by ElevenLabs
- **Personalized Feedback**: Data-driven suggestions for form improvement
- **Performance Tracking**: Detailed metrics and progress visualization
- **Training Plans**: Custom workout routines based on performance
- **Multiple Coaching Personas**: Motivational, Analytical, and Supportive modes

## Technologies Used

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **AI Integration**: ElevenLabs Agents API
- **Computer Vision**: Custom pose detection algorithms
- **Data Visualization**: Recharts
- **UI Components**: Shadcn/ui

## Setup Instructions

### Prerequisites

- Node.js (v18 or later)  
- npm or yarn  
- ElevenLabs API key (optional for demo mode)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-sports-coach.git
   cd ai-sports-coach

2. Install dependencies:
npm install
3. Create a .env.local file in the root directory with your ElevenLabs credentials:
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here
4. Run the development server:
npm run dev
5. Open http://localhost:3000 in your browser.
## Using the App


Start a Workout:
Select an exercise from the dropdown
Click "Start Workout" to begin analysis
Position yourself in front of your camera
Receive Feedback:
The app will analyze your form in real-time
Voice coach provides immediate feedback
Visual indicators show proper form alignment
Review Performance:
Check the Metrics tab for detailed analysis
View your training plan and progress
Interact with the AI coach for personalized tips
