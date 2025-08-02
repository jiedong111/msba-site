#!/usr/bin/env python3
"""
Test model predictions with generated sample data
"""

import pandas as pd
import numpy as np
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from services import AnalysisService
from generate_test_data import generate_test_data


def test_model_predictions(num_samples=20):
    """Test all available models with generated data"""
    
    print("🚀 Starting model prediction tests\n")
    
    # Initialize analysis service
    service = AnalysisService()
    
    # Get available models
    available_models = service.model_service.get_available_models()
    print(f"📦 Available models: {available_models}\n")
    
    if not available_models:
        print("❌ No models found in the models/ directory")
        return
    
    # Generate test data
    print(f"🔄 Generating {num_samples} test samples...")
    test_df = generate_test_data(num_samples)
    print(f"✅ Generated test data with shape: {test_df.shape}\n")
    
    # Save test data
    test_file = "test_predictions_data.csv"
    test_df.to_csv(test_file, index=False)
    print(f"💾 Test data saved to: {test_file}\n")
    
    # Test each model
    results = {}
    for model_name in available_models:
        print(f"="*60)
        print(f"🤖 Testing model: {model_name}")
        print(f"="*60)
        
        try:
            # Make predictions
            analysis_result = service.analyze_csv(test_df, model_name)
            
            # Extract key metrics
            predictions = np.array(analysis_result['predictions'])
            stats = analysis_result['summary_stats']
            insights = analysis_result['insights']
            
            print(f"✅ Predictions successful!")
            print(f"\n📊 Summary Statistics:")
            print(f"  - Count: {stats['count']}")
            print(f"  - Mean: {stats['mean']:.4f}")
            print(f"  - Std: {stats['std']:.4f}")
            print(f"  - Min: {stats['min']:.4f}")
            print(f"  - Max: {stats['max']:.4f}")
            print(f"  - Median: {stats['median']:.4f}")
            
            print(f"\n📈 Distribution Insights:")
            print(f"  - Shape: {insights['distribution_shape']}")
            print(f"  - Outliers: {insights['outlier_count']} ({insights['outlier_percentage']:.1f}%)")
            
            print(f"\n🎯 Risk Segments:")
            for level, data in insights['risk_segments'].items():
                print(f"  - {level.capitalize()}: {data['count']} ({data['percentage']:.1f}%)")
            
            print(f"\n📊 Percentiles:")
            for percentile, value in insights['percentiles'].items():
                print(f"  - {percentile}: {value:.4f}")
            
            # Save predictions to CSV
            predictions_file = f"predictions_{model_name}.csv"
            predictions_df = test_df.copy()
            predictions_df['prediction'] = predictions
            predictions_df.to_csv(predictions_file, index=False)
            print(f"\n💾 Predictions saved to: {predictions_file}")
            
            results[model_name] = {
                'success': True,
                'stats': stats,
                'insights': insights
            }
            
        except Exception as e:
            print(f"❌ Error testing {model_name}: {str(e)}")
            results[model_name] = {
                'success': False,
                'error': str(e)
            }
        
        print()
    
    # Summary
    print("="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    successful_models = [m for m, r in results.items() if r['success']]
    failed_models = [m for m, r in results.items() if not r['success']]
    
    print(f"\n✅ Successful models ({len(successful_models)}):")
    for model in successful_models:
        print(f"  - {model}")
    
    if failed_models:
        print(f"\n❌ Failed models ({len(failed_models)}):")
        for model in failed_models:
            print(f"  - {model}: {results[model]['error']}")
    
    # Compare models
    if len(successful_models) > 1:
        print(f"\n🔍 Model Comparison (Mean Predictions):")
        for model in successful_models:
            mean_pred = results[model]['stats']['mean']
            print(f"  - {model}: {mean_pred:.4f}")
    
    print(f"\n✅ Testing complete! Generated files:")
    print(f"  - {test_file} (input data)")
    for model in successful_models:
        print(f"  - predictions_{model}.csv (predictions)")
    
    return results


def main():
    """Main function"""
    # Parse arguments
    num_samples = 20
    if len(sys.argv) > 1:
        try:
            num_samples = int(sys.argv[1])
        except ValueError:
            print(f"Invalid number of samples: {sys.argv[1]}, using default 20")
    
    # Run tests
    test_model_predictions(num_samples)


if __name__ == "__main__":
    main()