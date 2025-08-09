# AI Sports Coach

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

### 3. Open the app in your browser

```bash
"$BROWSER" http://localhost:3000
```


---

## Features

- **Live Pose Analysis:** Real-time feedback on your exercise form using AI-powered pose detection.
- **Voice Feedback:** Audio guidance and feedback using ElevenLabs API or mock audio.
- **Performance Metrics:** Track your workout session and progress.
- **Conversational Agent:** Chat-based assistant for personalized coaching.
- **Training Plan:** Adaptive workout plans based on your performance.

---

## Environment Variables

To enable ElevenLabs voice synthesis, copy `.env.local.example` to `.env.local` and add your API key:

```bash
cp .env.local.example .env.local
# Edit .env.local and set ELEVENLABS_API_KEY
```

