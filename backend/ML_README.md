# Machine Learning Pipeline for MSBA Application

This document describes the machine learning pipeline integrated with the MSBA application for risk assessment and analysis.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Train Models
```bash
python run_training.py
```

### 3. Start the API Server
```bash
python main.py
```

## 📊 Available Models

The pipeline trains and saves the following models:

1. **Logistic Regression** (`logistic_regression_model.pkl`)
   - Linear model for binary classification
   - Provides interpretable coefficients
   - Good baseline performance

2. **Decision Tree** (`decision_tree_model.pkl`)
   - Non-linear model with interpretable rules
   - Handles both numerical and categorical features
   - Provides feature importance rankings

3. **Random Forest** (`random_forest_model.pkl`)
   - Ensemble of decision trees
   - Robust to overfitting
   - Excellent feature importance analysis

4. **XGBoost** (`xgboost_model.pkl`)
   - Gradient boosting model
   - Often provides best performance
   - Handles complex feature interactions

## 🔧 Model Training Process

### Data Preprocessing
- **Feature Scaling**: Numerical features are standardized using StandardScaler
- **Feature Selection**: Uses specific predictors from the riskDBv4.csv dataset
- **Missing Values**: Handled by filling with zeros
- **VIF Analysis**: Performed to check for multicollinearity

### Features Used
**Scaled Features:**
- Number of Investors
- Trademarks Registered
- Number of Events
- Financing for entrepreneurs
- Governmental support and policies
- Taxes and bureaucracy
- Governmental programs
- R&D transfer
- Commercial and professional infrastructure
- Internal market dynamics
- Internal market openness
- Cultural and social norms

**Unscaled Features (Dummy Variables):**
- Diversity Spotlight Dummy
- Repeat_Founder
- America Dummy
- Asia Dummy
- Middle East Dummy
- Food and Restaurant Dummy
- High Tech Dummy

### Target Variable
- **Closed Dummy**: Binary indicator of business closure (1 = closed, 0 = open)

## 📁 File Structure

```
backend/
├── train_ml_models.py      # Main training script
├── run_training.py         # Training execution script
├── riskDBv4.csv           # Training dataset
├── models/                # Saved models directory
│   ├── scaler.pkl
│   ├── model_info.pkl
│   ├── logistic_regression_model.pkl
│   ├── decision_tree_model.pkl
│   ├── random_forest_model.pkl
│   └── xgboost_model.pkl
├── services.py            # Enhanced model service
├── main.py               # API endpoints
└── requirements.txt      # Dependencies
```

## 🔌 API Integration

### New Endpoints

1. **GET /api/models**
   - Returns information about available models
   - Shows model performance metrics
   - Lists required features

2. **POST /api/train-models**
   - Triggers model training
   - Returns training results and performance metrics

3. **POST /api/analyze-csv** (Enhanced)
   - Now supports multiple model types
   - Includes model performance information in response
   - Provides detailed preprocessing information

### Model Selection
When using the `/api/analyze-csv` endpoint, you can specify different models:

```bash
# Use logistic regression
curl -X POST "http://localhost:8000/api/analyze-csv" \
  -F "file=@your_data.csv" \
  -F "model_name=logistic_regression_model"

# Use random forest
curl -X POST "http://localhost:8000/api/analyze-csv" \
  -F "file=@your_data.csv" \
  -F "model_name=random_forest_model"

# Use XGBoost
curl -X POST "http://localhost:8000/api/analyze-csv" \
  -F "file=@your_data.csv" \
  -F "model_name=xgboost_model"
```

## 📈 Model Performance

The training script provides detailed performance metrics:

- **Accuracy**: Overall classification accuracy
- **Classification Report**: Precision, recall, F1-score for each class
- **Feature Importance**: Ranking of most important features
- **VIF Analysis**: Multicollinearity assessment

## 🔍 Data Requirements

### Input CSV Format
Your CSV file should contain the following columns (or a subset):

**Required for full functionality:**
- Number of Investors
- Trademarks Registered
- Number of Events
- Diversity Spotlight Dummy
- Repeat_Founder
- America Dummy
- Asia Dummy
- Middle East Dummy
- Financing for entrepreneurs
- Governmental support and policies
- Taxes and bureaucracy
- Governmental programs
- R&D transfer
- Commercial and professional infrastructure
- Internal market dynamics
- Internal market openness
- Cultural and social norms
- Food and Restaurant Dummy
- High Tech Dummy

**Note:** If some columns are missing, the system will use only available columns and log warnings.

## 🛠️ Customization

### Adding New Models
1. Add your model training code to `train_ml_models.py`
2. Save the model using pickle in the `models/` directory
3. Update the `model_info.pkl` with new model information

### Modifying Features
1. Edit the `predictors`, `scale_features`, and `leave_unscaled` lists in `train_ml_models.py`
2. Retrain the models using `python run_training.py`

### Hyperparameter Tuning
Modify the model parameters in `train_ml_models.py`:

```python
# Example: Tune Random Forest
rf_model = RandomForestClassifier(
    n_estimators=200,  # Increase number of trees
    max_depth=10,       # Increase depth
    min_samples_split=5, # Adjust split criteria
    random_state=42
)
```

## 🔧 Troubleshooting

### Common Issues

1. **Missing Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **CSV File Not Found**
   - Ensure `riskDBv4.csv` is in the backend directory
   - Check file permissions

3. **Memory Issues**
   - Reduce `n_estimators` in Random Forest
   - Use smaller `max_depth` values
   - Process data in batches

4. **Model Loading Errors**
   - Ensure models are trained before using API
   - Check file permissions in `models/` directory
   - Verify pickle compatibility

### Debug Mode
Enable detailed logging by setting the log level:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📊 Example Usage

### Training Models
```bash
cd backend
python run_training.py
```

### Using the API
```python
import requests

# Get available models
response = requests.get("http://localhost:8000/api/models")
models = response.json()
print(f"Available models: {models['available_models']}")

# Analyze CSV with specific model
with open("your_data.csv", "rb") as f:
    files = {"file": f}
    data = {"model_name": "random_forest_model"}
    response = requests.post("http://localhost:8000/api/analyze-csv", 
                           files=files, data=data)
    results = response.json()
    print(f"Predictions: {results['predictions'][:5]}")
```

## 🎯 Performance Tips

1. **Model Selection**
   - Use Logistic Regression for interpretability
   - Use Random Forest for balanced performance
   - Use XGBoost for best accuracy

2. **Data Quality**
   - Ensure consistent data types
   - Handle missing values appropriately
   - Check for data leakage

3. **Production Deployment**
   - Monitor model performance over time
   - Implement model versioning
   - Set up automated retraining pipelines

## 📚 Additional Resources

- [Scikit-learn Documentation](https://scikit-learn.org/)
- [XGBoost Documentation](https://xgboost.readthedocs.io/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## 🤝 Contributing

To contribute to the ML pipeline:

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Test thoroughly
5. Submit a pull request

## 📄 License

This ML pipeline is part of the MSBA application and follows the same license terms. 