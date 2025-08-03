from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import logging
import traceback
from typing import Dict, Any

from models import (
    CSVAnalysisRequest, CSVAnalysisResponse,
    SentimentAnalysisRequest, SentimentAnalysisResponse,
    RiskCalculateRequest, RiskCalculateResponse, RiskFeature
)
from services import AnalysisService, SentimentService, RiskService
from config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MSBA Analysis Dashboard API",
    description="API for CSV analysis and sentiment analysis",
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
analysis_service = AnalysisService()
sentiment_service = SentimentService()
risk_service = RiskService()


@app.get("/")
async def root():
    return {"message": "MSBA Analysis Dashboard API"}


@app.post("/api/analyze-csv", response_model=CSVAnalysisResponse)
async def analyze_csv(
    file: UploadFile = File(...),
    model_name: str = "model"
) -> Dict[str, Any]:
    logger.info(f"📊 Starting CSV analysis - File: {file.filename}, Model: {model_name}")
    
    try:
        # Validate file
        if not file.filename:
            logger.error("❌ No filename provided")
            raise HTTPException(status_code=400, detail="No file provided")
        
        if not file.filename.endswith('.csv'):
            logger.error(f"❌ Invalid file type: {file.filename}")
            raise HTTPException(status_code=400, detail="File must be a CSV file")
        
        logger.info(f"✅ File validation passed: {file.filename}")
        
        # Read CSV file
        logger.info("📖 Reading CSV file contents...")
        contents = await file.read()
        logger.info(f"📏 File size: {len(contents)} bytes")
        
        # Parse CSV
        logger.info("🔍 Parsing CSV data...")
        try:
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
            logger.info(f"📊 CSV parsed successfully - Shape: {df.shape}")
            logger.info(f"📋 Columns: {list(df.columns)}")
            logger.info(f"🔢 Data types: {df.dtypes.to_dict()}")
            
            # Log first few rows for debugging
            logger.info("📝 First 3 rows:")
            for i, row in df.head(3).iterrows():
                logger.info(f"   Row {i}: {row.to_dict()}")
                
        except UnicodeDecodeError as e:
            logger.error(f"❌ Unicode decode error: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid file encoding. Please ensure the file is UTF-8 encoded.")
        except pd.errors.EmptyDataError as e:
            logger.error(f"❌ Empty CSV file: {str(e)}")
            raise HTTPException(status_code=400, detail="CSV file is empty")
        except pd.errors.ParserError as e:
            logger.error(f"❌ CSV parsing error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")
        
        # Analyze with model
        logger.info(f"🤖 Starting model analysis with model: {model_name}")
        try:
            result = analysis_service.analyze_csv(df, model_name)
            logger.info("✅ Model analysis completed successfully")
            logger.info(f"📈 Predictions generated: {len(result.get('predictions', []))}")
            return result
            
        except FileNotFoundError as e:
            logger.error(f"❌ Model file not found: {str(e)}")
            raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found. Available models should be in the models/ directory.")
        except Exception as e:
            logger.error(f"❌ Model analysis error: {str(e)}")
            logger.error(f"🔍 Full traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Model analysis failed: {str(e)}")
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in analyze_csv: {str(e)}")
        logger.error(f"🔍 Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


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

@app.get("/api/models")
async def get_models():
    """Get information about available models"""
    try:
        model_info = analysis_service.get_model_info()
        return model_info
    except Exception as e:
        logger.error(f"❌ Error getting model info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting model info: {str(e)}")

@app.post("/api/train-models")
async def train_models():
    """Train all ML models"""
    try:
        from train_ml_models import train_ml_models
        logger.info("🚀 Starting model training...")
        model_info = train_ml_models()
        logger.info("✅ Model training completed")
        return {
            "status": "success",
            "message": "Models trained successfully",
            "model_info": model_info,
            "timestamp": pd.Timestamp.now().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Error training models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error training models: {str(e)}")

@app.post("/api/test-upload")
async def test_upload(file: UploadFile = File(...)):
    logger.info(f"🧪 Test upload - File: {file.filename}, Size: {file.size}")
    try:
        contents = await file.read()
        logger.info(f"📏 Read {len(contents)} bytes")
        return {"filename": file.filename, "size": len(contents), "status": "success"}
    except Exception as e:
        logger.error(f"❌ Test upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
        model_info = analysis_service.get_model_info()
        available_models = model_info.get("available_models", [])
        
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