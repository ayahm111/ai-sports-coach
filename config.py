import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    ELEVENLABS_API = os.getenv('ELEVENLABS_API')
    OPENAI_API = os.getenv('OPENAI_API')
    USE_PRE_RECORDED = False  # Switch to True if API limits hit