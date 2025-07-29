import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List
import httpx
import openai
from pathlib import Path
import json
from datetime import datetime

from config import settings


class ModelService:
    def __init__(self):
        self.loaded_models = {}
        
    def load_model(self, model_name: str):
        if model_name in self.loaded_models:
            return self.loaded_models[model_name]
            
        model_path = Path(settings.model_path) / f"{model_name}.pkl"
        if not model_path.exists():
            raise FileNotFoundError(f"Model {model_name}.pkl not found in {settings.model_path}")
            
        model = joblib.load(model_path)
        self.loaded_models[model_name] = model
        return model
        
    def predict(self, model_name: str, data: pd.DataFrame) -> np.ndarray:
        model = self.load_model(model_name)
        predictions = model.predict(data)
        return predictions
        

class AnalysisService:
    def __init__(self):
        self.model_service = ModelService()
        
    def analyze_csv(self, df: pd.DataFrame, model_name: str) -> Dict[str, Any]:
        # Get predictions
        predictions = self.model_service.predict(model_name, df)
        
        # Calculate summary statistics
        summary_stats = {
            "total_predictions": len(predictions),
            "mean_prediction": float(np.mean(predictions)),
            "std_prediction": float(np.std(predictions)),
            "min_prediction": float(np.min(predictions)),
            "max_prediction": float(np.max(predictions)),
            "quartiles": {
                "25%": float(np.percentile(predictions, 25)),
                "50%": float(np.percentile(predictions, 50)),
                "75%": float(np.percentile(predictions, 75))
            }
        }
        
        # Prepare chart data
        hist_counts, hist_bins = np.histogram(predictions, bins=20)
        charts = {
            "histogram": {
                "counts": hist_counts.tolist(),
                "bins": hist_bins.tolist(),
                "type": "histogram"
            },
            "distribution": {
                "values": predictions.tolist()[:100],  # Limit for performance
                "type": "line"
            }
        }
        
        return {
            "predictions": predictions.tolist(),
            "summary_stats": summary_stats,
            "charts": charts,
            "timestamp": datetime.now().isoformat()
        }
        

class SentimentService:
    def __init__(self):
        if settings.api_key:
            openai.api_key = settings.api_key
            
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
        if not settings.api_key:
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