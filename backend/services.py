import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List
import httpx
import openai
from pathlib import Path
import json
import logging
from datetime import datetime
import pickle

from config import settings

logger = logging.getLogger(__name__)


class ModelService:
    def __init__(self):
        self.models_dir = Path("models")
        self.loaded_models = {}
        self.loaded_scalers = {}
        self.model_info = None
        
    def load_model_info(self):
        """Load model information and feature lists"""
        if self.model_info is None:
            model_info_path = self.models_dir / "model_info.pkl"
            if model_info_path.exists():
                with open(model_info_path, 'rb') as f:
                    self.model_info = pickle.load(f)
                logger.info("✅ Loaded model info")
            else:
                logger.warning("⚠️ Model info not found, using default settings")
                self.model_info = {
                    'predictors': [],
                    'scale_features': [],
                    'leave_unscaled': []
                }
        return self.model_info
        
    def load_scaler(self):
        """Load the scaler for feature preprocessing"""
        if 'scaler' not in self.loaded_scalers:
            scaler_path = self.models_dir / "scaler.pkl"
            if scaler_path.exists():
                with open(scaler_path, 'rb') as f:
                    self.loaded_scalers['scaler'] = pickle.load(f)
                logger.info("✅ Loaded scaler")
            else:
                logger.warning("⚠️ Scaler not found, will use unscaled features")
                self.loaded_scalers['scaler'] = None
        return self.loaded_scalers['scaler']
        
    def load_model(self, model_name: str):
        """Load model from .pkl file"""
        if model_name in self.loaded_models:
            return self.loaded_models[model_name]
            
        model_path = self.models_dir / f"{model_name}.pkl"
        if not model_path.exists():
            raise FileNotFoundError(f"Model {model_name}.pkl not found in models directory")
            
        try:
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            self.loaded_models[model_name] = model
            logger.info(f"✅ Loaded model: {model_name} from {model_path}")
            return model
        except (pickle.UnpicklingError, EOFError, ValueError) as e:
            logger.error(f"❌ Corrupted model file: {model_name}.pkl - {e}")
            raise FileNotFoundError(f"Model {model_name}.pkl is corrupted and cannot be loaded")
        
    def preprocess_data(self, df: pd.DataFrame, model_name: str = None) -> pd.DataFrame:
        """Preprocess data according to the model requirements"""
        model_info = self.load_model_info()
        scaler = self.load_scaler()
        
        # Try to load the model to get the correct feature order
        try:
            model = self.load_model(model_name) if model_name else None
            
            if model and hasattr(model, 'feature_names_in_'):
                predictors = model.feature_names_in_.tolist()
                logger.info(f"📋 Using model's stored feature names: {len(predictors)} features")
            elif model and 'xgboost' in model_name.lower():
                # For XGBoost, try to get feature names from booster
                if hasattr(model, 'get_booster'):
                    booster = model.get_booster()
                    if hasattr(booster, 'feature_names') and booster.feature_names:
                        predictors = booster.feature_names
                        logger.info(f"📋 Using XGBoost booster feature names: {len(predictors)} features")
                    else:
                        predictors = model_info.get('predictors', [])
                else:
                    predictors = model_info.get('predictors', [])
            else:
                predictors = model_info.get('predictors', [])
        except Exception as e:
            logger.warning(f"⚠️ Could not load model to get features: {e}")
            predictors = model_info.get('predictors', [])
        
        scale_features = model_info.get('scale_features', [])
        leave_unscaled = model_info.get('leave_unscaled', [])
        
        # Check if we have the required columns
        available_columns = df.columns.tolist()
        missing_columns = [col for col in predictors if col not in available_columns]
        
        if missing_columns:
            logger.warning(f"⚠️ Missing columns in data: {missing_columns}")
            logger.info(f"📋 Available columns: {available_columns}")
            # Use only available columns
            predictors = [col for col in predictors if col in available_columns]
            scale_features = [col for col in scale_features if col in available_columns]
            leave_unscaled = [col for col in leave_unscaled if col in available_columns]
        
        if not predictors:
            logger.warning("⚠️ No predictors available, using all numeric columns")
            return df.select_dtypes(include=[np.number])
        
        # Select only the required predictors IN THE EXACT ORDER
        # This is critical for model compatibility
        df_subset = df[predictors].copy()
        
        # Handle missing values
        df_subset = df_subset.fillna(0)
        
        # Scale features if scaler is available
        if scaler is not None and scale_features:
            try:
                # Scale the features that need scaling
                scaled_features = scaler.transform(df_subset[scale_features])
                df_subset[scale_features] = scaled_features
                logger.info(f"✅ Scaled {len(scale_features)} features")
            except Exception as e:
                logger.error(f"❌ Error scaling features: {e}")
                # Continue without scaling
        else:
            logger.info("ℹ️ No scaler available, using unscaled features")
        
        logger.info(f"✅ Preprocessed data shape: {df_subset.shape}")
        return df_subset
        
    def predict(self, model_name: str, df: pd.DataFrame) -> np.ndarray:
        """Make predictions on the dataframe"""
        model = self.load_model(model_name)
        
        # Preprocess the data
        processed_df = self.preprocess_data(df, model_name)
        
        # Log the column order for debugging
        logger.info(f"📋 Processed columns order: {processed_df.columns.tolist()}")
        logger.info(f"📋 Processed data shape: {processed_df.shape}")
        
        # Make predictions
        try:
            predictions = model.predict(processed_df)
            logger.info(f"📊 Made {len(predictions)} predictions with {model_name}")
            logger.info(f"📊 Sample predictions (first 5): {predictions[:5]}")
            logger.info(f"📊 Prediction range: [{predictions.min():.2f}, {predictions.max():.2f}]")
            logger.info(f"📊 Mean prediction: {predictions.mean():.2f}")
        except Exception as e:
            logger.error(f"❌ Error making predictions: {e}")
            logger.error(f"📋 Processed columns order: {processed_df.columns.tolist()}")
            
            # Try to get expected feature names for debugging
            if hasattr(model, 'feature_names_in_'):
                logger.error(f"📋 Model expects: {model.feature_names_in_.tolist()}")
            elif 'xgboost' in model_name.lower() and hasattr(model, 'get_booster'):
                booster = model.get_booster()
                if hasattr(booster, 'feature_names'):
                    logger.error(f"📋 XGBoost expects: {booster.feature_names}")
                    
            raise
        
        return predictions
        
    def get_available_models(self) -> List[str]:
        """Get list of available models (excluding corrupted ones)"""
        available_models = []
        for model_file in self.models_dir.glob("*.pkl"):
            if not model_file.name.startswith("scaler") and not model_file.name.startswith("model_info"):
                model_name = model_file.stem
                
                # Test if model can be loaded
                try:
                    with open(model_file, 'rb') as f:
                        pickle.load(f)
                    available_models.append(model_name)
                    logger.info(f"✅ Verified model: {model_name}")
                except (pickle.UnpicklingError, EOFError, ValueError) as e:
                    logger.warning(f"⚠️ Skipping corrupted model: {model_name} - {e}")
                    continue
                    
        return available_models
        

class AnalysisService:
    def __init__(self):
        self.model_service = ModelService()
        
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about available models and their performance"""
        model_info = self.model_service.load_model_info()
        available_models = self.model_service.get_available_models()
        
        return {
            "available_models": available_models,
            "model_info": model_info,
            "timestamp": datetime.now().isoformat()
        }
        
    def analyze_csv(self, df: pd.DataFrame, model_name: str) -> Dict[str, Any]:
        """Analyze CSV and return meaningful insights"""
        
        # Get predictions
        predictions = self.model_service.predict(model_name, df)
        
        # Calculate percentiles for context
        percentiles = np.percentile(predictions, [10, 25, 50, 75, 90])
        
        # Create meaningful bins
        bins = np.histogram(predictions, bins=10)
        
        # Identify outliers (using IQR method)
        Q1 = np.percentile(predictions, 25)
        Q3 = np.percentile(predictions, 75)
        IQR = Q3 - Q1
        outliers = ((predictions < Q1 - 1.5 * IQR) | (predictions > Q3 + 1.5 * IQR)).sum()
        
        # Get model performance info
        model_info = self.model_service.load_model_info()
        model_performance = model_info.get('model_performance', {})
        
        return {
            "model_used": model_name,
            "predictions": predictions.tolist(),
            "summary_stats": {
                "count": len(predictions),
                "mean": float(np.mean(predictions)),
                "std": float(np.std(predictions)),
                "min": float(np.min(predictions)),
                "max": float(np.max(predictions)),
                "median": float(np.median(predictions))
            },
            "insights": {
                "percentiles": {
                    "10%": float(percentiles[0]),
                    "25%": float(percentiles[1]),
                    "50%": float(percentiles[2]),
                    "75%": float(percentiles[3]),
                    "90%": float(percentiles[4])
                },
                "outlier_count": int(outliers),
                "outlier_percentage": float(outliers / len(predictions) * 100),
                "distribution_shape": self._describe_distribution(predictions),
                "risk_segments": self._segment_predictions(predictions)
            },
            "chart_data": {
                "histogram": {
                    "bins": bins[1].tolist(),
                    "counts": bins[0].tolist()
                },
                "predictions": predictions[:100].tolist(),  # First 100 for line chart
                "indices": list(range(min(100, len(predictions))))
            },
            "model_performance": model_performance,
            "timestamp": datetime.now().isoformat()
        }
    
    def _describe_distribution(self, predictions):
        """Describe the shape of the distribution"""
        skewness = float(np.mean((predictions - np.mean(predictions))**3) / np.std(predictions)**3)
        
        if abs(skewness) < 0.5:
            return "Normal (symmetric)"
        elif skewness > 0.5:
            return "Right-skewed (more low values)"
        else:
            return "Left-skewed (more high values)"
    
    def _segment_predictions(self, predictions):
        """Segment predictions into risk categories"""
        thresholds = np.percentile(predictions, [33, 67])
        
        low = (predictions < thresholds[0]).sum()
        medium = ((predictions >= thresholds[0]) & (predictions < thresholds[1])).sum()
        high = (predictions >= thresholds[1]).sum()
        
        return {
            "low": {"count": int(low), "percentage": float(low / len(predictions) * 100)},
            "medium": {"count": int(medium), "percentage": float(medium / len(predictions) * 100)},
            "high": {"count": int(high), "percentage": float(high / len(predictions) * 100)}
        }
        

class SentimentService:
    def __init__(self):
        if settings.openai_api_key:
            openai.api_key = settings.openai_api_key
            
    async def search_web(self, query: str) -> List[Dict[str, str]]:
        if not settings.serper_api_key:
            # Fallback to mock data for demo
            return [
                {"title": f"Latest news about {query}", "snippet": "Positive growth indicators..."},
                {"title": f"{query} quarterly report", "snippet": "Strong performance in Q4..."},
                {"title": f"Market analysis: {query}", "snippet": "Analysts remain optimistic..."}
            ]
            
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": settings.serper_api_key},
                json={"q": f"{query} news sentiment", "num": 10}
            )
            data = response.json()
            return [{"title": r.get("title", ""), "snippet": r.get("snippet", "")} 
                    for r in data.get("organic", [])]
            
    async def analyze_sentiment(self, company_name: str) -> Dict[str, Any]:
        # Search for web content
        web_results = await self.search_web(company_name)
        
        # Combine snippets for analysis
        content = "\n".join([f"{r['title']}: {r['snippet']}" for r in web_results])
        
        # Analyze sentiment (mock if no API key)
        if not settings.openai_api_key:
            # Demo sentiment analysis
            sentiment_score = np.random.uniform(0.3, 0.9)
            risk_level = "low" if sentiment_score > 0.7 else "medium" if sentiment_score > 0.4 else "high"
            factors = [
                "Strong financial performance" if sentiment_score > 0.7 else "Market volatility",
                "Positive analyst ratings" if sentiment_score > 0.6 else "Competitive pressure",
                "Growing market share" if sentiment_score > 0.5 else "Regulatory concerns"
            ]
        else:
            # Real OpenAI analysis
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Analyze the sentiment and risk level of the company based on the provided text. Return a JSON with sentiment_score (0-1), risk_level (low/medium/high), and contributing_factors (list of strings)."},
                    {"role": "user", "content": f"Company: {company_name}\n\nContent:\n{content}"}
                ],
                temperature=0.3
            )
            analysis = json.loads(response.choices[0].message.content)
            sentiment_score = analysis["sentiment_score"]
            risk_level = analysis["risk_level"]
            factors = analysis["contributing_factors"]
            
        return {
            "company_name": company_name,
            "sentiment_score": sentiment_score,
            "risk_level": risk_level,
            "contributing_factors": factors,
            "web_sources": web_results,
            "timestamp": datetime.now()
        }