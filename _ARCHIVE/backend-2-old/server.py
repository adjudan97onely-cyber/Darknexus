from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import json

from ai_engine import Preferences, extract_ingredients_from_photo_note, normalize_ingredients, recommend_recipes
from db import get_recent_history, get_stats, init_db, save_analysis, save_recommendations


class AnalyzeIngredientsRequest(BaseModel):
    ingredients: list[str] = Field(default_factory=list)
    vegetarian: bool = False
    quick_only: bool = False
    max_prep_minutes: int = 45


class AnalyzePhotoRequest(BaseModel):
    photo_note: str
    vegetarian: bool = False
    quick_only: bool = False
    max_prep_minutes: int = 45


app = FastAPI(title="Chef IA - Machine de Guerre API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "chef-ia-backend"}


@app.post("/api/analyze-ingredients")
def analyze_ingredients(payload: AnalyzeIngredientsRequest) -> dict:
    normalized = normalize_ingredients(payload.ingredients)
    preferences = Preferences(
        vegetarian=payload.vegetarian,
        quick_only=payload.quick_only,
        max_prep_minutes=payload.max_prep_minutes,
    )
    recommendations = recommend_recipes(normalized, preferences)

    analysis_id = save_analysis(
        ingredients_raw=", ".join(payload.ingredients),
        ingredients_normalized=", ".join(normalized),
        preferences_json=json.dumps(payload.model_dump()),
    )
    save_recommendations(analysis_id, recommendations)

    return {
        "analysis_id": analysis_id,
        "normalized_ingredients": normalized,
        "recommendations": recommendations,
    }


@app.post("/api/analyze-photo")
def analyze_photo(payload: AnalyzePhotoRequest) -> dict:
    extracted = extract_ingredients_from_photo_note(payload.photo_note)
    preferences = Preferences(
        vegetarian=payload.vegetarian,
        quick_only=payload.quick_only,
        max_prep_minutes=payload.max_prep_minutes,
    )
    recommendations = recommend_recipes(extracted, preferences)

    analysis_id = save_analysis(
        ingredients_raw=payload.photo_note,
        ingredients_normalized=", ".join(extracted),
        preferences_json=json.dumps(payload.model_dump()),
    )
    save_recommendations(analysis_id, recommendations)

    return {
        "analysis_id": analysis_id,
        "extracted_ingredients": extracted,
        "recommendations": recommendations,
    }


@app.get("/api/history")
def history(limit: int = 10) -> dict:
    return {"items": get_recent_history(limit=limit)}


@app.get("/api/stats")
def stats() -> dict:
    return get_stats()
