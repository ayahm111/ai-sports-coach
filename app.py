from flask import Flask, render_template, request, jsonify
from config import Config
import elevenlabs
import openai
import os

app = Flask(__name__)
app.config.from_object(Config)

elevenlabs.set_api_key(app.config['ELEVENLABS_API'])
openai.api_key = app.config['OPENAI_API']

EXERCISE_DB = {
    "pushup": {
        "feedback": "Keep your core tight and elbows at 45 degrees.",
        "voice_file": "pushup_feedback.mp3"  # Pre-generated for demo
    },
    "squat": {
        "feedback": "Maintain straight back and knees over toes.",
        "voice_file": "squat_feedback.mp3"
    }
}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    user_input = request.json.get('exercise')
    
    # Get AI-generated feedback
    try:
        if user_input.lower() in EXERCISE_DB:
            feedback = EXERCISE_DB[user_input.lower()]['feedback']
        else:
            # Fallback to OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{
                    "role": "system",
                    "content": "You're a professional fitness coach. Give concise, technical feedback."
                }, {
                    "role": "user",
                    "content": f"Analyze this exercise: {user_input}"
                }]
            )
            feedback = response.choices[0].message.content
        
        # generate voice (or use pre-recorded)
        if app.config['USE_PRE_RECORDED']:
            audio_url = f"/static/{EXERCISE_DB.get(user_input.lower(), {}).get('voice_file', 'default.mp3')}"
        else:
            audio = elevenlabs.generate(
                text=feedback,
                voice="Rachel",
                model="eleven_monolingual_v1"
            )
            audio_url = audio  
        
        return jsonify({
            "feedback": feedback,
            "audio_url": audio_url
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)