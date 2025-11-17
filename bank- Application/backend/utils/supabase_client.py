# utils/supabase_client.py
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env

def get_supabase_client():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")

    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in the environment variables.")

    return create_client(url, key)
