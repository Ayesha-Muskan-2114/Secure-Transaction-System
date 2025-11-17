from utils.supabase_client import get_supabase_client

supabase = get_supabase_client()
print(supabase)
res = supabase.table("users").select("*").execute()
print("Users table data:", res.data)
