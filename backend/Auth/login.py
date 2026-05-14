from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins="http://localhost:5173",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY"),
)


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/auth/login")
def login(body: LoginRequest):
    # Step 1: look up email by username in your profiles table
    result = (
        supabase.table("account")
        .select("email")
        .eq("username", body.username)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    email = result.data["email"]

    # Step 2: hand email + password to Supabase — it does the hashing and comparing
    try:
        auth_response = supabase.auth.sign_in_with_password(
            {"email": email, "password": body.password}
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Step 3: return the JWT and basic user info to the frontend
    return {
        "access_token": auth_response.session.access_token,
        "token_type": "bearer",
        "user": {
            "id": auth_response.user.id,
            "email": auth_response.user.email,
        }
    }