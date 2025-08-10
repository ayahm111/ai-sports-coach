# 🚀 Deployment Guide - AI Sports Coach

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup
Before deploying, you need to configure your environment variables:

#### Required Variables:
\`\`\`env
ELEVENLABS_API_KEY=your_actual_api_key_here
ELEVENLABS_AGENT_ID=your_actual_agent_id_here
NODE_ENV=production
\`\`\`

#### How to Get ElevenLabs Credentials:

**API Key:**
1. Go to [ElevenLabs API Keys](https://elevenlabs.io/app/speech-synthesis/api-keys)
2. Click "Create API Key"
3. Copy the generated key

**Agent ID:**
1. Go to [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
2. Create a new agent or select existing one
3. Copy the Agent ID from the agent settings

### 2. Update .env.local
Replace the placeholder values in `.env.local`:
\`\`\`env
ELEVENLABS_API_KEY=sk_your_actual_key_here
ELEVENLABS_AGENT_ID=agent_your_actual_id_here
NODE_ENV=production
\`\`\`

## 🌐 Deployment Platforms

### Vercel (Recommended)

#### Option 1: Deploy Button
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-sports-coach)

#### Option 2: Manual Deployment
1. **Install Vercel CLI:**
   \`\`\`bash
   npm i -g vercel
   \`\`\`

2. **Login to Vercel:**
   \`\`\`bash
   vercel login
   \`\`\`

3. **Deploy:**
   \`\`\`bash
   vercel
   \`\`\`

4. **Set Environment Variables:**
   \`\`\`bash
   vercel env add ELEVENLABS_API_KEY
   vercel env add ELEVENLABS_AGENT_ID
   vercel env add NODE_ENV
   \`\`\`

5. **Redeploy with Environment Variables:**
   \`\`\`bash
   vercel --prod
   \`\`\`

#### Vercel Dashboard Setup:
1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - `ELEVENLABS_API_KEY` → Your ElevenLabs API key
   - `ELEVENLABS_AGENT_ID` → Your ElevenLabs Agent ID
   - `NODE_ENV` → `production`

### Netlify

1. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`

2. **Environment Variables:**
   - Go to **Site Settings** → **Environment Variables**
   - Add the same variables as above

### Railway

1. **Deploy from GitHub:**
   \`\`\`bash
   railway login
   railway link
   railway up
   \`\`\`

2. **Set Environment Variables:**
   \`\`\`bash
   railway variables set ELEVENLABS_API_KEY=your_key_here
   railway variables set ELEVENLABS_AGENT_ID=your_agent_id_here
   railway variables set NODE_ENV=production
   \`\`\`

## 🔒 Security Best Practices

### Environment Variables Security:
- ✅ Never commit `.env.local` to git
- ✅ Use different API keys for development/production
- ✅ Rotate API keys regularly
- ✅ Monitor API usage in ElevenLabs dashboard

### HTTPS Requirements:
- ✅ Camera access requires HTTPS in production
- ✅ Microphone access requires HTTPS
- ✅ All deployment platforms provide HTTPS by default

## 🧪 Testing Deployment

### 1. Verify Environment Variables:
After deployment, check the app loads and shows:
- ✅ "ElevenLabs Integration Active" (if keys are set)
- ✅ "Demo Mode Active" (if keys are missing)

### 2. Test Core Features:
- ✅ Camera access works
- ✅ Pose detection shows landmarks
- ✅ Exercise analysis provides scores
- ✅ Voice features work (if ElevenLabs configured)

### 3. Check Browser Console:
- ✅ No API key errors
- ✅ WebSocket connections work
- ✅ No CORS issues

## 🐛 Troubleshooting

### Common Issues:

**1. "ElevenLabs API key not configured"**
- Check environment variables are set correctly
- Verify API key is valid in ElevenLabs dashboard
- Ensure no extra spaces in environment variables

**2. Camera not working in production:**
- Ensure site is served over HTTPS
- Check browser permissions
- Verify domain is not blocked

**3. WebSocket connection fails:**
- Check ElevenLabs Agent ID is correct
- Verify agent is active in ElevenLabs dashboard
- Check network/firewall settings

**4. Build failures:**
- Run `npm run build` locally first
- Check for TypeScript errors
- Verify all dependencies are installed

## 📊 Monitoring & Analytics

### ElevenLabs Usage:
- Monitor API usage in ElevenLabs dashboard
- Set up usage alerts
- Track conversation quality metrics

### Performance Monitoring:
\`\`\`bash
# Add performance monitoring (optional)
npm install @vercel/analytics
\`\`\`

### Error Tracking:
\`\`\`bash
# Add error tracking (optional)
npm install @sentry/nextjs
\`\`\`

## 🔄 Updates & Maintenance

### Regular Updates:
1. **Dependencies:**
   \`\`\`bash
   npm update
   npm audit fix
   \`\`\`

2. **ElevenLabs Models:**
   - Check for new voice models
   - Update voice IDs if needed
   - Test new features

3. **Security:**
   - Rotate API keys quarterly
   - Update Node.js version
   - Monitor security advisories

## 🎯 Production Optimizations

### Performance:
- ✅ Images optimized with Next.js Image component
- ✅ Code splitting enabled
- ✅ Static generation where possible
- ✅ API routes optimized for serverless

### Caching:
- ✅ Static assets cached
- ✅ API responses cached appropriately
- ✅ Audio files cached for reuse

### Monitoring:
- ✅ Error boundaries implemented
- ✅ Loading states for all async operations
- ✅ Graceful degradation when APIs fail

## 🌟 Post-Deployment

### Share Your App:
- ✅ Test on different devices
- ✅ Share with beta users
- ✅ Collect feedback
- ✅ Monitor usage patterns

### Scale Considerations:
- Monitor ElevenLabs API usage
- Consider implementing user authentication
- Add usage analytics
- Plan for increased traffic

---

**Need Help?** 
- Check the [Next.js deployment docs](https://nextjs.org/docs/deployment)
- Review [ElevenLabs API documentation](https://elevenlabs.io/docs)
- Open an issue if you encounter problems
