import joblib
import numpy as np
from sklearn.linear_model import LinearRegression
from pathlib import Path

# Create a simple linear regression model for demo
X = np.random.rand(100, 5)
y = np.sum(X, axis=1) + np.random.normal(0, 0.1, 100)

model = LinearRegression()
model.fit(X, y)

# Save the model
models_dir = Path("models")
models_dir.mkdir(exist_ok=True)

model_path = models_dir / "model.pkl"
joblib.dump(model, model_path)

print(f"Sample model saved to {model_path}")
print("The model expects 5 features and returns a single prediction value")