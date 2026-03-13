from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid


class CodeFile(BaseModel):
    filename: str
    language: str
    content: str


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=20, max_length=2000)
    type: str = Field(..., pattern="^(web-app|python-script|excel-automation|game-script|ai-app|api)$")
    tech_stack: Optional[str] = None
    ai_model: Optional[str] = Field(default='gpt-5.1', description="Modèle IA à utiliser")


class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    type: str
    tech_stack: List[str] = []
    status: str = "pending"  # pending, in-progress, completed, error
    ai_model_used: Optional[str] = None  # Modèle IA utilisé pour la génération
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    code_files: List[CodeFile] = []

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    type: str
    tech_stack: List[str]
    status: str
    ai_model_used: Optional[str] = None
    created_at: str
    code_files: List[CodeFile] = []
