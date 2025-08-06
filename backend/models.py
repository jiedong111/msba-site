from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime


class SentimentAnalysisRequest(BaseModel):
    company_name: str
    

class SentimentAnalysisResponse(BaseModel):
    company_name: str
    sentiment_score: float
    risk_level: str  # "low", "medium", "high"
    contributing_factors: List[str]
    web_sources: List[Dict[str, str]]
    timestamp: datetime


class RiskCalculateRequest(BaseModel):
    feature_values: Dict[str, Any]
    model_name: Optional[str] = "xgboost_model"

    
class RiskCalculateResponse(BaseModel):
    risk_score: float
    risk_level: str
    

class RiskFeature(BaseModel):
    name: str
    display_name: str
    type: str  # "slider", "switch", "select"
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    default_value: Any
    step: Optional[float] = None
    description: str