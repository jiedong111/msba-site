from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import logging
import traceback
from typing import Dict, Any

from models import (
    SentimentAnalysisRequest, SentimentAnalysisResponse,
    RiskCalculateRequest, RiskCalculateResponse, RiskFeature
)
from services import ModelService, SentimentService, RiskService
from config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MSBA Analysis Dashboard API",
    description="API for risk calculation and sentiment analysis",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"🌐 {request.method} {request.url} - Headers: {dict(request.headers)}")
    response = await call_next(request)
    logger.info(f"📤 Response: {response.status_code}")
    return response

# Initialize services
model_service = ModelService()
sentiment_service = SentimentService()
risk_service = RiskService()


@app.get("/")
async def root():
    return {"message": "MSBA Analysis Dashboard API"}




@app.post("/api/sentiment-analysis", response_model=SentimentAnalysisResponse)
async def analyze_sentiment(
    request: SentimentAnalysisRequest
) -> Dict[str, Any]:
    try:
        result = await sentiment_service.analyze_sentiment(request.company_name)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing sentiment: {str(e)}")


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": pd.Timestamp.now()}


@app.post("/api/risk/calculate", response_model=RiskCalculateResponse)
async def calculate_risk(request: RiskCalculateRequest) -> Dict[str, Any]:
    """Calculate startup failure risk based on feature values"""
    logger.info(f"🎯 Risk calculation request - Model: {request.model_name}")
    
    try:
        result = risk_service.calculate_risk(
            feature_values=request.feature_values,
            model_name=request.model_name
        )
        logger.info(f"📊 Risk calculated: {result['risk_score']:.3f} ({result['risk_level']})")
        return result
        
    except Exception as e:
        logger.error(f"❌ Risk calculation error: {str(e)}")
        logger.error(f"🔍 Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Risk calculation failed: {str(e)}")

@app.get("/api/risk/features")
async def get_risk_features():
    """Get feature definitions for the risk calculator"""
    try:
        features = risk_service.get_feature_definitions()
        logger.info(f"📋 Returning {len(features)} feature definitions")
        return {"features": features}
        
    except Exception as e:
        logger.error(f"❌ Error getting risk features: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting features: {str(e)}")

@app.get("/api/risk/models")
async def get_risk_models():
    """Get available models for risk calculation"""
    try:
        available_models = model_service.get_available_models()
        
        # Format for risk calculator
        models = []
        for model_name in available_models:
            display_name = model_name.replace("_", " ").title()
            models.append({
                "name": model_name,
                "display_name": display_name,
                "accuracy": 0.85  # Mock accuracy for now
            })
        
        logger.info(f"🤖 Returning {len(models)} available models")
        return {"models": models}
        
    except Exception as e:
        logger.error(f"❌ Error getting risk models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting models: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)