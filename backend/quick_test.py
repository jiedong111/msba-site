#!/usr/bin/env python3
"""
Quick test to verify CSV upload and model predictions work
"""

import pandas as pd
from services import AnalysisService

def test_csv_analysis():
    """Test CSV analysis with a small sample"""
    
    # Create a small test dataframe with required columns
    test_data = {
        'Number of Investors': [2, 5, 0, 3, 1],
        'Trademarks Registered': [1, 3, 0, 2, 1],
        'Number of Events': [5, 10, 2, 8, 3],
        'Financing for entrepreneurs': [4.5, 5.2, 3.8, 4.9, 4.1],
        'Governmental support and policies': [4.2, 4.8, 3.5, 4.5, 4.0],
        'Taxes and bureaucracy': [3.5, 4.1, 2.9, 3.8, 3.2],
        'Governmental programs': [4.8, 5.3, 4.1, 5.0, 4.4],
        'R&D transfer': [4.0, 4.6, 3.3, 4.3, 3.8],
        'Commercial and professional infrastructure': [5.2, 5.8, 4.5, 5.5, 4.9],
        'Internal market dynamics': [4.7, 5.3, 4.0, 5.0, 4.4],
        'Internal market openness': [5.0, 5.6, 4.3, 5.3, 4.7],
        'Cultural and social norms': [4.5, 5.1, 3.8, 4.8, 4.2],
        'Diversity Spotlight Dummy': [1, 0, 1, 0, 1],
        'Repeat_Founder': [0, 1, 0, 1, 0],
        'America Dummy': [1, 1, 1, 1, 1],
        'Asia Dummy': [0, 0, 0, 0, 0],
        'Middle East Dummy': [0, 0, 0, 0, 0],
        'Food and Restaurant Dummy': [0, 0, 1, 0, 0],
        'High Tech Dummy': [1, 1, 0, 1, 0]
    }
    
    df = pd.DataFrame(test_data)
    
    # Test with different models
    service = AnalysisService()
    models_to_test = ['xgboost_model', 'random_forest_model', 'logistic_regression_model']
    
    print("🧪 Testing CSV Analysis with Different Models\n")
    
    for model_name in models_to_test:
        print(f"Testing {model_name}...")
        try:
            result = service.analyze_csv(df, model_name)
            print(f"✅ Success! Mean prediction: {result['summary_stats']['mean']:.4f}")
            print(f"   Risk distribution: Low={result['insights']['risk_segments']['low']['percentage']:.0f}%, "
                  f"Medium={result['insights']['risk_segments']['medium']['percentage']:.0f}%, "
                  f"High={result['insights']['risk_segments']['high']['percentage']:.0f}%\n")
        except Exception as e:
            print(f"❌ Failed: {e}\n")

if __name__ == "__main__":
    test_csv_analysis()