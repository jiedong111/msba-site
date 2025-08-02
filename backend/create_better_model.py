#!/usr/bin/env python3
"""
Create a better sample model that provides meaningful predictions.
"""

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from pathlib import Path

# Create sample training data
np.random.seed(42)
n_samples = 1000
n_features = 5

X = np.random.randn(n_samples, n_features)
# Create a meaningful relationship
y = (
    2 * X[:, 0] +           # Strong positive relationship with feature 0
    -1.5 * X[:, 1] +        # Negative relationship with feature 1
    0.5 * X[:, 2] +         # Weak positive relationship with feature 2
    np.sin(X[:, 3]) +       # Non-linear relationship with feature 3
    0.1 * X[:, 4] +         # Very weak relationship with feature 4
    np.random.normal(0, 0.5, n_samples)  # Add some noise
)

# Scale to a meaningful range (e.g., 0-100 for scores)
y = (y - y.min()) / (y.max() - y.min()) * 100

# Train model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

# Save model
models_dir = Path("models")
models_dir.mkdir(exist_ok=True)
joblib.dump(model, models_dir / "model.pkl")

print(f"✅ Model saved to {models_dir / 'model.pkl'}")
print(f"📊 Model expects {n_features} numeric features")
print(f"📊 Model outputs predictions in range 0-100")
print(f"📊 Feature importances: {model.feature_importances_}")
print(f"📊 Training score: {model.score(X, y):.3f}")

# Test with sample data
test_X = np.random.randn(10, n_features)
test_predictions = model.predict(test_X)
print(f"📊 Sample predictions: {test_predictions[:5]}")
print(f"📊 Prediction range: [{test_predictions.min():.2f}, {test_predictions.max():.2f}]")