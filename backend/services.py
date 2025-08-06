# %%
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
                # Use the actual predictors from training
                self.model_info = {
                    'predictors': [
                        "Trademarks Registered",
                        "Number of Events",
                        "Diversity Spotlight Dummy",
                        "Repeat_Founder",
                        "Asia Dummy",
                        "Middle East Dummy",
                        "Financing for entrepreneurs",
                        "Governmental support and policies",
                        "Taxes and bureaucracy",
                        "Governmental programs",
                        "R&D transfer",
                        "Basic school entrepreneurial education and training",
                        "Post school entrepreneurial education and training",
                        "Physical and services infrastructure",
                        "Commercial and professional infrastructure",
                        "Internal market dynamics",
                        "Internal market openness",
                        "Cultural and social norms",
                        "Food and Restaurant Dummy",
                        "High Tech Dummy",
                    ],
                    'scale_features': [
                        "Trademarks Registered",
                        "Number of Events",
                        "Financing for entrepreneurs",
                        "Governmental support and policies",
                        "Basic school entrepreneurial education and training",
                        "Post school entrepreneurial education and training",
                        "Taxes and bureaucracy",
                        "Governmental programs",
                        "R&D transfer",
                        "Physical and services infrastructure",
                        "Commercial and professional infrastructure",
                        "Internal market dynamics",
                        "Internal market openness",
                        "Cultural and social norms",
                    ],
                    'leave_unscaled': [
                        "Diversity Spotlight Dummy",
                        "Repeat_Founder",
                        "Asia Dummy",
                        "Middle East Dummy",
                        "Food and Restaurant Dummy",
                        "High Tech Dummy",
                    ]
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
        

class RiskService:
    def __init__(self):
        self.model_service = ModelService()
        
    def get_feature_definitions(self) -> List[Dict[str, Any]]:
        """Get feature definitions for the risk calculator"""
        return [
            {
                "name": "Trademarks Registered",
                "display_name": "Trademarks Registered",
                "type": "slider",
                "min_value": 0,
                "max_value": 10,
                "default_value": 0,
                "step": 1,
                "description": "Number of registered trademarks"
            },
            {
                "name": "Number of Events",
                "display_name": "Number of Events",
                "type": "slider",
                "min_value": 0,
                "max_value": 50,
                "default_value": 2,
                "step": 1,
                "description": "Number of events or activities the startup has participated in"
            },
            {
                "name": "Financing for entrepreneurs",
                "display_name": "Financing for entrepreneurs",
                "type": "slider",
                "min_value": 1.0,
                "max_value": 7.0,
                "default_value": 2.8,
                "step": 0.1,
                "description": "The availability of financial resources—equity and debt—for small and medium enterprises (SMEs) (including grants and subsidies)"
            },
            {
                "name": "Governmental support and policies",
                "display_name": "Governmental support and policies",
                "type": "slider",
                "min_value": 1.0,
                "max_value": 7.0,
                "default_value": 2.5,
                "step": 0.1,
                "description": "The extent to which public policies support entrepreneurship - entrepreneurship as a relevant economic issue"
            },
            {
                "name": "Taxes and bureaucracy",
                "display_name": "Taxes and bureaucracy",
                "type": "slider",
                "min_value": 1.0,
                "max_value": 7.0,
                "default_value": 2.2,
                "step": 0.1,
                "description": "The extent to which public policies support entrepreneurship - taxes or regulations are either size-neutral or encourage new and SMEs"
            },
            {
                "name": "Governmental programs",
                "display_name": "Governmental programs",
                "type": "slider",
                "min_value": 1.0,
                "max_value": 7.0,
                "default_value": 2.8,
                "step": 0.1,
                "description": "The presence and quality of programs directly assisting SMEs at all levels of government (national, regional, municipal)"
            },
            {
                "name": "R&D transfer",
                "display_name": "R&D Transfer",
                "type": "slider",
                "min_value": 1.0,
                "max_value": 7.0,
                "default_value": 2.5,
                "step": 0.1,
                "description": "The extent to which national research and development will lead to new commercial opportunities and is available to SMEs"
            },
            {
                "name": "Basic school entrepreneurial education and training",
                "display_name": "Basic school entrepreneurial education and training",
                "type": "slider",
                "min_value": 1.0,
                "max_value": 7.0,
                "default_value": 2.2,
                "step": 0.1,
                "description": "The extent to which training in creating or managing SMEs is incorporated within the education and training system at primary and secondary levels"
            },
            {
                "name": "Post school entrepreneurial education and training",
                "display_name": "Post school entrepreneurial education and training",
                "type": "slider",
                "min_value": 1.0,
                "max_value": 7.0,
                "default_value": 2.8,
                "step": 0.1,
                "description": "The extent to which training in creating or managing SMEs is incorporated within the education and training system in higher education such as vocational, college, business schools, etc."
            },
            {
                "name": "Physical and services infrastructure",
                "display_name": "Physical and services infrastructure",
                "type": "slider",
                "min_value": 1.0,
                "max_value": 7.0,
                "default_value": 3.2,
                "step": 0.1,
                "description": "Ease of access to physical resources—communication, utilities, transportation, land or space—at a price that does not discriminate against SMEs"
            },
            {
                "name": "Commercial and professional infrastructure",
                "display_name": "Commercial and professional infrastructure",
                "type": "slider",
                "min_value": 1.0,
                "max_value": 7.0,
                "default_value": 3.2,
                "step": 0.1,
                "description": "The presence of property rights, commercial, accounting and other legal and assessment services and institutions that support or promote SMEs"
            },
            {
                "name": "Internal market dynamics",
                "display_name": "Internal market dynamics",
                "type": "slider",
                "min_value": 1.0,
                "max_value": 7.0,
                "default_value": 2.8,
                "step": 0.1,
                "description": "The competitive landscape and market conditions affecting new business entry and growth"
            },
            {
                "name": "Internal market openness",
                "display_name": "Internal market openness",
                "type": "slider",
                "min_value": 1.0,
                "max_value": 7.0,
                "default_value": 3.2,
                "step": 0.1,
                "description": "The extent to which new firms are free to enter existing markets"
            },
            {
                "name": "Cultural and social norms",
                "display_name": "Cultural and social norms",
                "type": "slider",
                "min_value": 1.0,
                "max_value": 7.0,
                "default_value": 2.8,
                "step": 0.1,
                "description": "The extent to which social and cultural norms encourage or allow actions leading to new business methods or activities that can potentially increase personal wealth and income"
            },
            {
                "name": "Diversity Spotlight Dummy",
                "display_name": "Diversity Spotlight",
                "type": "switch",
                "default_value": False,
                "description": "Whether the startup has diversity spotlight recognition"
            },
            {
                "name": "Repeat_Founder",
                "display_name": "Repeat Founder",
                "type": "switch",
                "default_value": False,
                "description": "Whether the founder has started companies before"
            },
            {
                "name": "High Tech Dummy",
                "display_name": "High-Tech Startup",
                "type": "switch",
                "default_value": False,
                "description": "Whether this is a high-tech startup"
            },
            {
                "name": "Asia Dummy",
                "display_name": "Asia Region",
                "type": "switch",
                "default_value": False,
                "description": "Startup is located in Asia"
            },
            {
                "name": "Middle East Dummy",
                "display_name": "Middle East Region",
                "type": "switch",
                "default_value": False,
                "description": "Startup is located in the Middle East"
            },
            {
                "name": "Food and Restaurant Dummy",
                "display_name": "Food & Restaurant",
                "type": "switch",
                "default_value": False,
                "description": "Whether this is a food and restaurant business"
            }
        ]
    
    def get_default_values(self) -> Dict[str, Any]:
        """Get default values for all features"""
        features = self.get_feature_definitions()
        defaults = {}
        for feature in features:
            defaults[feature["name"]] = feature["default_value"]
        
        return defaults
    
    def calculate_risk(self, feature_values: Dict[str, Any], model_name: str = "xgboost_model") -> Dict[str, Any]:
        """Calculate risk score from feature values"""
        
        # Get default values and update with provided values
        full_features = self.get_default_values()
        full_features.update(feature_values)
        
        # Convert boolean values to integers
        for key, value in full_features.items():
            if isinstance(value, bool):
                full_features[key] = int(value)
        
        # Create DataFrame
        df = pd.DataFrame([full_features])
        
        # Get probability prediction instead of binary prediction
        try:
            model = self.model_service.load_model(model_name)
            processed_df = self.model_service.preprocess_data(df, model_name)
            
            # Use predict_proba if available (for probability scores)
            if hasattr(model, 'predict_proba'):
                probabilities = model.predict_proba(processed_df)
                # Get probability of failure (class 1)
                risk_score = float(probabilities[0][1]) if probabilities.shape[1] > 1 else float(probabilities[0][0])
                logger.info(f"📊 Probability prediction: {probabilities[0]} -> Risk score: {risk_score:.4f}")
            else:
                # Fallback to binary prediction
                predictions = model.predict(processed_df)
                risk_score = float(predictions[0])
                logger.info(f"📊 Binary prediction: {risk_score}")
                
        except Exception as e:
            logger.error(f"❌ Error getting probability prediction: {e}")
            # Fallback to original method
            predictions = self.model_service.predict(model_name, df)
            risk_score = float(predictions[0])
        
        # Determine risk level based on probability
        if risk_score < 0.3:
            risk_level = "low"
        elif risk_score < 0.7:
            risk_level = "medium"
        else:
            risk_level = "high"
        
        return {
            "risk_score": risk_score,
            "risk_level": risk_level
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