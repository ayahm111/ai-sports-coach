# ElevenLabs Integration Setup Guide

## 🎯 Required API Keys

### 1. ElevenLabs API Key
1. Go to [ElevenLabs API Keys](https://elevenlabs.io/app/speech-synthesis/api-keys)
2. Create a new API key
3. Copy the key and add to `.env.local`:
   \`\`\`
   ELEVENLABS_API_KEY=your_api_key_here
   \`\`\`

### 2. ElevenLabs Agent ID
1. Go to [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
2. Create a new agent or use existing one
3. Configure your agent with these settings:

#### Agent Configuration:
\`\`\`json
{
  "name": "AI Sports Coach",
  "description": "Real-time fitness form analysis coach",
  "prompt": "You are an AI sports coach that provides real-time feedback on exercise form based on pose detection data.",
  "language": "en",
  "conversation_config": {
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5,
      "prefix_padding_ms": 300,
      "silence_duration_ms": 500
    }
  },
  "tts_config": {
    "voice_id": "21m00Tcm4TlvDq8ikWAM",
    "model_id": "eleven_turbo_v2_5",
    "stability": 0.5,
    "similarity_boost": 0.7,
    "style": 0.4,
    "use_speaker_boost": true
  }
}
\`\`\`

4. Copy the Agent ID and add to `.env.local`:
   \`\`\`
   ELEVENLABS_AGENT_ID=your_agent_id_here
   \`\`\`

## 🚀 Features Enabled

### With ElevenLabs Integration:
- ✅ **Real-time Speech-to-Text** using ElevenLabs STT
- ✅ **Natural Voice Responses** with ElevenLabs TTS
- ✅ **WebSocket Connection** for low-latency conversation
- ✅ **Context-Aware Responses** based on workout data
- ✅ **Multiple Personas** (Motivational, Analytical, Supportive)
- ✅ **Real-time Form Feedback** integrated with voice

### Without API Keys (Demo Mode):
- ✅ **Browser Speech Recognition** fallback
- ✅ **Mock Voice Synthesis** for testing
- ✅ **All visual features** work normally
- ⚠️ **Limited voice quality** and features

## 🎙️ Voice Features

### Speech-to-Text
- **ElevenLabs STT**: High-quality, low-latency transcription
- **WebSocket streaming**: Real-time audio processing
- **Automatic turn detection**: Knows when you stop speaking
- **Noise handling**: Works in gym environments

### Text-to-Speech
- **Natural voices**: Choose from ElevenLabs voice library
- **Persona-based delivery**: Different speaking styles
- **Real-time synthesis**: Immediate response to your form
- **Contextual responses**: References your actual performance data

## 🔧 Testing the Integration

### 1. Verify API Keys
\`\`\`bash
# Check if keys are loaded
npm run dev
# Look for "ElevenLabs Integration Active" in console
\`\`\`

### 2. Test Voice Features
1. Start a workout
2. Click "Talk to ElevenLabs" 
3. Speak: "How am I doing?"
4. Should hear natural voice response with your actual data

### 3. Test Real-time Feedback
1. Perform exercises in front of camera
2. AI coach should automatically comment on your form
3. Voice feedback should reference actual scores

## 🎯 Competition Features

### ElevenLabs Agents Integration
- **Low-latency conversation**: < 500ms response time
- **Context awareness**: Remembers workout session
- **Tool calling**: Accesses pose analysis data
- **Natural interruption**: Can interrupt and be interrupted
- **Emotional intelligence**: Adapts tone based on performance

### Real-world Applications
- **Personal training**: Replace expensive 1-on-1 coaching
- **Rehabilitation**: Voice-guided physical therapy
- **Group fitness**: Individual feedback in classes
- **Accessibility**: Voice-first interface for visually impaired

## 🐛 Troubleshooting

### Common Issues:

1. **"ElevenLabs API key not configured"**
   - Check `.env.local` file exists
   - Verify API key is correct
   - Restart development server

2. **"WebSocket connection failed"**
   - Check Agent ID is correct
   - Verify agent is active in ElevenLabs dashboard
   - Check network connectivity

3. **"Microphone access denied"**
   - Allow microphone permissions in browser
   - Use HTTPS in production
   - Check browser compatibility

4. **"No voice response"**
   - Check browser audio permissions
   - Verify speakers/headphones work
   - Check ElevenLabs account credits

### Debug Mode:
\`\`\`bash
# Enable debug logging
NEXT_PUBLIC_DEBUG=true npm run dev
\`\`\`

## 📊 Performance Optimization

### WebSocket Management
- Automatic reconnection on disconnect
- Efficient audio streaming
- Context updates only when needed
- Proper cleanup on component unmount

### Audio Processing
- Optimized audio chunks
- Base64 encoding for WebSocket
- Audio context reuse
- Memory management for audio buffers

## 🏆 Competition Advantages

1. **Real ElevenLabs Integration**: Not just a demo
2. **Production-ready**: Handles errors gracefully
3. **Scalable architecture**: WebSocket + REST API
4. **Natural conversation**: Context-aware responses
5. **Data-driven coaching**: Uses actual pose analysis
