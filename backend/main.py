from backend.translator import router as translator_router
import sys
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from datetime import timedelta
from typing import List, Optional
import requests
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Import local modules
from backend import models, schemas
from backend.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    get_current_user,
    get_db,
    get_password_hash,
    verify_password,
)
from backend.database import Base, engine

# Initialize database
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI()
app.include_router(translator_router)  # Add this line right after creating the app

# CORS middleware
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]

import os
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    for origin in allowed_origins_env.split(","):
        clean_origin = origin.strip()
        if clean_origin and clean_origin not in origins:
            origins.append(clean_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your existing routes and other code...


@app.post("/auth/register", response_model=schemas.TokenResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user with default role
    user = models.User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role="user"  # Set default role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    # Create user data for response
    user_data = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }


@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(login_in: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return schemas.TokenResponse(
        access_token=access_token,
        user=schemas.UserRead.from_orm(user),
    )


@app.get("/auth/me", response_model=schemas.UserRead)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return schemas.UserRead.from_orm(current_user)


# Translation models
class TranslationRequest(BaseModel):
    text: str
    target_lang: str = "es"
    source_lang: str = "auto"

class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str

@app.post("/api/translate", response_model=TranslationResponse)
async def translate_text(
    request: TranslationRequest,
    current_user: models.User = Depends(get_current_user)
):
    if not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text to translate cannot be empty"
        )

    url = "https://libretranslate.de/translate"
    payload = {
        "q": request.text,
        "source": request.source_lang,
        "target": request.target_lang,
        "format": "text"
    }

    try:
        response = requests.post(url, data=payload)
        response.raise_for_status()
        result = response.json()
        return {
            "original_text": request.text,
            "translated_text": result.get("translatedText", ""),
            "source_language": result.get("detectedLanguage", {}).get("language", request.source_lang),
            "target_language": request.target_lang
        }
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation service error: {str(e)}"
        )

# Notes endpoints
@app.get("/notes", response_model=List[schemas.NoteRead])
def list_notes(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Note)
        .filter(models.Note.user_id == current_user.id)
        .order_by(models.Note.created_at.desc())
        .all()
    )


@app.post("/notes", response_model=schemas.NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(
    note_in: schemas.NoteCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = models.Note(user_id=current_user.id, text=note_in.text)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@app.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = (
        db.query(models.Note)
        .filter(models.Note.id == note_id, models.Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    db.delete(note)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.delete("/notes", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_notes(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(models.Note).filter(models.Note.user_id == current_user.id).delete()
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
