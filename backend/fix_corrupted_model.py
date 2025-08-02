#!/usr/bin/env python3
"""
Fix corrupted model.pkl by removing it or regenerating it
"""

import os
import sys
from pathlib import Path
import pickle

def check_models():
    """Check all model files for corruption"""
    models_dir = Path("models")
    
    print("🔍 Checking model files for corruption...\n")
    
    corrupted_models = []
    valid_models = []
    
    for model_file in models_dir.glob("*.pkl"):
        if model_file.name.startswith("scaler") or model_file.name.startswith("model_info"):
            continue
            
        model_name = model_file.stem
        print(f"Checking {model_name}...")
        
        try:
            with open(model_file, 'rb') as f:
                model = pickle.load(f)
            print(f"  ✅ Valid - {type(model).__name__}")
            valid_models.append(model_name)
        except Exception as e:
            print(f"  ❌ Corrupted - {e}")
            corrupted_models.append((model_name, model_file))
    
    print(f"\n📊 Summary:")
    print(f"  Valid models: {len(valid_models)} - {valid_models}")
    print(f"  Corrupted models: {len(corrupted_models)} - {[m[0] for m in corrupted_models]}")
    
    return corrupted_models, valid_models

def fix_corrupted_models(corrupted_models):
    """Fix corrupted models"""
    if not corrupted_models:
        print("✅ No corrupted models found!")
        return
    
    print(f"\n🔧 Found {len(corrupted_models)} corrupted model(s):")
    
    for model_name, model_file in corrupted_models:
        print(f"\n❌ Corrupted: {model_name}")
        print(f"   File: {model_file}")
        print(f"   Size: {model_file.stat().st_size} bytes")
        
        # Option 1: Delete the corrupted file
        response = input(f"Delete corrupted {model_name}.pkl? (y/n): ").lower().strip()
        if response == 'y':
            try:
                model_file.unlink()
                print(f"  ✅ Deleted {model_file}")
            except Exception as e:
                print(f"  ❌ Error deleting: {e}")
        else:
            print(f"  ⏭️ Skipping {model_name}")

def main():
    """Main function"""
    print("🛠️ Model Corruption Checker and Fixer\n")
    
    corrupted_models, valid_models = check_models()
    
    if corrupted_models:
        print(f"\n⚠️ Found corrupted models that need attention!")
        fix_corrupted_models(corrupted_models)
    else:
        print(f"\n✅ All models are valid!")
    
    # Suggest regenerating models if needed
    if corrupted_models:
        print(f"\n💡 To regenerate missing models, you can:")
        print(f"   1. Run: python train_ml_models.py")
        print(f"   2. Or use the API: POST /api/train-models")

if __name__ == "__main__":
    main()