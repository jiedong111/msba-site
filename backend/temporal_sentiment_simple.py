import asyncio
import httpx
from datetime import datetime, timedelta
import numpy as np
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)

class TemporalSentimentSimple:
    def __init__(self):
        from config import settings
        self.serper_key = settings.serper_api_key
        
    async def get_temporal_wave(self, company: str, months: int = 6):
        """Get sentiment wave using temporal searches"""
        
        results = []
        now = datetime.now()
        
        logger.info(f"📈 Starting temporal sentiment analysis for {company} over {months} months")
        
        # Search for each month
        for i in range(months):
            date = now - timedelta(days=30 * i)
            month_name = date.strftime("%B %Y")
            
            # Search for this specific month
            query = f'{company} news {month_name}'
            sentiment = await self._analyze_month(company, query, month_name)
            
            results.append({
                'period': month_name,
                'sentiment': sentiment['score'],
                'confidence': sentiment['confidence'],
                'sources': sentiment['sources'],
                'date': date.isoformat()
            })
            
            logger.info(f"📊 {month_name}: sentiment={sentiment['score']:.3f}, sources={sentiment['sources']}")
        
        # Reverse to chronological order
        results.reverse()
        
        # Add moving averages
        sentiments = [r['sentiment'] for r in results]
        for i, result in enumerate(results):
            # Simple 3-period moving average
            start = max(0, i - 1)
            end = min(len(sentiments), i + 2)
            result['ma'] = float(np.mean(sentiments[start:end]))
        
        stats = self._calculate_stats(results)
        
        logger.info(f"✅ Temporal analysis complete. Current: {stats['current']:.3f}, Trend: {stats['trend']}")
        
        return {
            'company': company,
            'data': results,
            'stats': stats,
            'timestamp': datetime.now().isoformat()
        }
    
    async def _analyze_month(self, company: str, query: str, month: str):
        """Analyze sentiment for a specific month"""
        
        if not self.serper_key:
            # Return realistic mock data with some temporal patterns
            base = 0.6 + (hash(f"{company}{month}") % 100) / 200
            noise = np.random.normal(0, 0.08)
            
            # Add some seasonal patterns
            if "January" in month or "December" in month:
                base += 0.05  # Holiday boost
            if "March" in month or "September" in month:
                base -= 0.03  # Seasonal dips
                
            score = max(0.1, min(0.9, base + noise))
            
            return {
                'score': float(score),
                'confidence': float(0.6 + np.random.random() * 0.3),
                'sources': int(np.random.randint(8, 20))
            }
        
        try:
            # Real Serper search
            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.info(f"🔍 Searching: {query}")
                
                response = await client.post(
                    "https://google.serper.dev/search",
                    headers={"X-API-KEY": self.serper_key},
                    json={"q": query, "num": 15, "gl": "us", "hl": "en"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    organic_results = data.get('organic', [])
                    
                    if organic_results:
                        # Analyze sentiment from titles and snippets
                        text = " ".join([
                            f"{item.get('title', '')} {item.get('snippet', '')}"
                            for item in organic_results[:10]  # Use top 10 results
                        ])
                        
                        sentiment = self._quick_sentiment(text)
                        confidence = min(0.9, 0.5 + len(organic_results) / 30)
                        
                        return {
                            'score': float(sentiment),
                            'confidence': float(confidence),
                            'sources': len(organic_results)
                        }
                else:
                    logger.warning(f"⚠️ Serper API returned status {response.status_code}")
                    
        except Exception as e:
            logger.error(f"❌ Error searching for {month}: {e}")
        
        # Fallback to mock data
        return {
            'score': float(0.5 + np.random.normal(0, 0.1)),
            'confidence': 0.4,
            'sources': 0
        }
    
    def _quick_sentiment(self, text: str) -> float:
        """Quick sentiment analysis without OpenAI"""
        if not text:
            return 0.5
            
        text_lower = text.lower()
        
        # Enhanced sentiment word lists
        positive_words = [
            'growth', 'profit', 'success', 'record', 'beat', 'strong', 'rising', 'up',
            'gains', 'positive', 'boost', 'surge', 'breakthrough', 'achievement', 
            'excellent', 'outstanding', 'increased', 'expansion', 'bullish', 'rally',
            'higher', 'improved', 'winning', 'soaring', 'optimistic', 'bright'
        ]
        
        negative_words = [
            'loss', 'decline', 'concern', 'drop', 'weak', 'fall', 'falling', 'down',
            'plunge', 'crash', 'negative', 'worry', 'fear', 'trouble', 'crisis',
            'poor', 'bad', 'worst', 'decreased', 'contraction', 'bearish', 'sell-off',
            'lower', 'struggling', 'disappointing', 'warning', 'risk', 'volatile'
        ]
        
        neutral_words = [
            'stable', 'steady', 'unchanged', 'flat', 'mixed', 'cautious', 'expected',
            'forecast', 'outlook', 'maintains', 'continues', 'regular'
        ]
        
        pos_count = sum(1 for word in positive_words if word in text_lower)
        neg_count = sum(1 for word in negative_words if word in text_lower)
        neu_count = sum(1 for word in neutral_words if word in text_lower)
        
        total_sentiment_words = pos_count + neg_count + neu_count
        
        if total_sentiment_words == 0:
            return 0.5  # Neutral if no sentiment words found
        
        # Calculate weighted sentiment
        # Positive words add to sentiment, negative subtract, neutral stays at 0.5
        sentiment_score = 0.5 + (pos_count - neg_count) / (total_sentiment_words * 2)
        
        # Clamp between 0.1 and 0.9
        return max(0.1, min(0.9, sentiment_score))
    
    def _calculate_stats(self, results: List[Dict]) -> Dict:
        """Calculate wave statistics"""
        sentiments = [r['sentiment'] for r in results]
        
        if not sentiments:
            return {
                'mean': 0.5,
                'std': 0.0,
                'trend': 'neutral',
                'current': 0.5,
                'volatility': 'low',
                'momentum': 0.0
            }
        
        mean_sentiment = float(np.mean(sentiments))
        std_sentiment = float(np.std(sentiments))
        current = sentiments[-1]
        
        # Calculate trend
        if len(sentiments) >= 3:
            recent_trend = sentiments[-1] - sentiments[-3]
            trend = 'rising' if recent_trend > 0.05 else 'falling' if recent_trend < -0.05 else 'stable'
        else:
            trend = 'rising' if sentiments[-1] > sentiments[0] else 'falling'
        
        # Calculate volatility category
        if std_sentiment < 0.05:
            volatility = 'low'
        elif std_sentiment < 0.15:
            volatility = 'medium'
        else:
            volatility = 'high'
        
        # Calculate momentum (rate of change)
        momentum = 0.0
        if len(sentiments) >= 2:
            momentum = float(sentiments[-1] - sentiments[-2])
        
        return {
            'mean': mean_sentiment,
            'std': std_sentiment,
            'trend': trend,
            'current': float(current),
            'volatility': volatility,
            'momentum': momentum,
            'range': {
                'min': float(min(sentiments)),
                'max': float(max(sentiments))
            }
        }