"""
Data models for MCP Server
"""
from pydantic import BaseModel, Field
from datetime import datetime

class Document(BaseModel):
    """Document model"""
    id: str
    name: str
    path: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    modified_at: datetime = Field(default_factory=datetime.utcnow)
    size: int
    mime_type: str
    type: str = "file"  # "file" or "directory"
