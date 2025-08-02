from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


class CSVAnalysisRequest(BaseModel):
    model_name: str
    

class CSVAnalysisResponse(BaseModel):
    model_used: str
    predictions: List[float]
    summary_stats: Dict[str, Any]
    insights: Dict[str, Any]
    chart_data: Dict[str, Any]
    model_performance: Optional[Dict[str, Any]] = None
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