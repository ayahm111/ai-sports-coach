document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyze-btn');
    const exerciseInput = document.getElementById('exercise-input');
    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackText = document.getElementById('feedback-text');
    const feedbackAudio = document.getElementById('feedback-audio');

    analyzeBtn.addEventListener('click', async () => {
        const exercise = exerciseInput.value.trim();
        if (!exercise) return;

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exercise })
            });

            const data = await response.json();
            
            if (data.error) throw new Error(data.error);

            feedbackText.textContent = data.feedback;
            feedbackAudio.src = data.audio_url;
            feedbackContainer.classList.remove('hidden');
            
        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error(error);
        }
    });
});