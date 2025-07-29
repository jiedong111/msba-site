from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


class CSVAnalysisRequest(BaseModel):
    model_name: str
    

class CSVAnalysisResponse(BaseModel):
    predictions: List[float]
    summary_stats: Dict[str, Any]
    charts: Dict[str, Any]
    timestamp: str
    

class SentimentAnalysisRequest(BaseModel):
    company_name: str
    

class SentimentAnalysisResponse(BaseModel):
    company_name: str
    sentiment_score: float
    risk_level: str  # "low", "medium", "high"
    contributing_factors: List[str]
    web_sources: List[Dict[str, str]]
    timestamp: datetime