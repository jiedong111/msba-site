#!/usr/bin/env python3
"""
Script to run the ML training pipeline
"""

import sys
import os
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

def main():
    """Run the ML training pipeline"""
    print("🚀 Starting ML Training Pipeline")
    print("=" * 50)
    
    try:
        # Import and run the training function
        from train_ml_models import train_ml_models
        
        print("📊 Training ML models...")
        model_info = train_ml_models()
        
        print("\n🎉 Training completed successfully!")
        print("=" * 50)
        print("📁 Models saved to the 'models/' directory")
        print("📊 Model performance summary:")
        
        performance = model_info.get('model_performance', {})
        for model_name, accuracy in performance.items():
            print(f"   - {model_name.replace('_', ' ').title()}: {accuracy:.4f}")
            
        print("\n✅ You can now use these models with the API!")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure all required packages are installed:")
        print("   pip install -r requirements.txt")
        return 1
        
    except FileNotFoundError as e:
        print(f"❌ File not found: {e}")
        print("💡 Make sure riskDBv4.csv is in the current directory")
        return 1
        
    except Exception as e:
        print(f"❌ Error during training: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 