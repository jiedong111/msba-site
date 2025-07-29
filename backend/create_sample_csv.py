#!/usr/bin/env python3
"""
Script to create a sample CSV file compatible with the sample model.
The model expects 5 numeric features and produces a prediction based on their sum.
"""

import pandas as pd
import numpy as np
from pathlib import Path

def create_sample_csv(num_rows=100, filename="sample_data.csv"):
    """
    Create a sample CSV with 5 features that the sample model was trained on.
    
    Args:
        num_rows (int): Number of rows to generate
        filename (str): Output filename
    """
    
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Generate 5 features similar to training data
    # Using random values between 0 and 1 (same as training data)
    data = {
        'feature_1': np.random.rand(num_rows),
        'feature_2': np.random.rand(num_rows), 
        'feature_3': np.random.rand(num_rows),
        'feature_4': np.random.rand(num_rows),
        'feature_5': np.random.rand(num_rows)
    }
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Add some realistic column names for demonstration
    df.columns = ['sales_score', 'marketing_score', 'customer_rating', 'product_quality', 'market_demand']
    
    # Save to CSV
    output_path = Path(filename)
    df.to_csv(output_path, index=False)
    
    print(f"✅ Sample CSV created: {output_path}")
    print(f"📊 Shape: {df.shape}")
    print(f"🔢 Features: {list(df.columns)}")
    print("\nFirst 5 rows:")
    print(df.head())
    print(f"\n💡 Upload this CSV to the application and use 'model' as the model name")
    
    return df

if __name__ == "__main__":
    # Create sample CSV
    df = create_sample_csv(100, "sample_data.csv")
    
    # Also create a smaller test file
    small_df = create_sample_csv(20, "test_data.csv")
    print(f"\n✅ Also created smaller test file: test_data.csv ({small_df.shape[0]} rows)")