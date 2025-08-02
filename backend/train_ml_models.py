import pandas as pd
import pickle
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import seaborn as sns
import statsmodels.api as sm
from statsmodels.tools.tools import add_constant
from statsmodels.stats.outliers_influence import variance_inflation_factor
import numpy as np
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def train_ml_models():
    """Train multiple ML models and save them for the application"""
    
    logger.info("🚀 Starting ML model training pipeline...")
    
    # Load data from the correct location
    csv_path = Path("riskDBv4.csv")
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found at {csv_path}")
    
    logger.info(f"📊 Loading data from {csv_path}")
    df = pd.read_csv(csv_path)
    logger.info(f"✅ Data loaded - Shape: {df.shape}")
    logger.info(f"📋 Columns: {list(df.columns)}")
    
    # Full predictor list
    predictors = [
        'Number of Investors', 
        'Trademarks Registered',
        'Number of Events', 
        'Diversity Spotlight Dummy', 'Repeat_Founder',
        'America Dummy', 'Asia Dummy', 'Middle East Dummy',
        'Financing for entrepreneurs', 'Governmental support and policies',
        'Taxes and bureaucracy', 'Governmental programs', 'R&D transfer',
        'Commercial and professional infrastructure', 'Internal market dynamics',
        'Internal market openness', 'Cultural and social norms',
        'Food and Restaurant Dummy', 'High Tech Dummy'
    ]
    
    # Features to scale vs leave unscaled
    scale_features = [
        'Number of Investors', 
        'Trademarks Registered',
        'Number of Events', 
        'Financing for entrepreneurs', 'Governmental support and policies',
        'Taxes and bureaucracy', 'Governmental programs', 'R&D transfer',
        'Commercial and professional infrastructure', 'Internal market dynamics',
        'Internal market openness', 'Cultural and social norms'
    ]
    
    leave_unscaled = [
        'Diversity Spotlight Dummy', 'Repeat_Founder',
        'America Dummy', 'Asia Dummy', 'Middle East Dummy',
        'Food and Restaurant Dummy', 'High Tech Dummy'
    ]
    
    # Check if all required columns exist
    missing_columns = [col for col in predictors if col not in df.columns]
    if missing_columns:
        logger.warning(f"⚠️ Missing columns: {missing_columns}")
        # Remove missing columns from predictors
        predictors = [col for col in predictors if col in df.columns]
        scale_features = [col for col in scale_features if col in df.columns]
        leave_unscaled = [col for col in leave_unscaled if col in df.columns]
    
    logger.info(f"✅ Using {len(predictors)} predictors: {predictors}")
    
    # Prepare feature matrices
    X_unscaled = df[predictors]
    X_scaled_part = StandardScaler().fit_transform(df[scale_features])
    X_scaled = pd.DataFrame(X_scaled_part, columns=scale_features)
    X_scaled[leave_unscaled] = df[leave_unscaled].reset_index(drop=True)
    
    # Target variable
    y = df['Closed Dummy']
    
    logger.info(f"🎯 Target variable shape: {y.shape}")
    logger.info(f"📊 Class distribution: {y.value_counts().to_dict()}")
    
    # VIF Analysis
    logger.info("🔍 Performing VIF analysis...")
    X_scaled_const = add_constant(X_scaled)
    vif_data = pd.DataFrame()
    vif_data["Feature"] = X_scaled_const.columns
    vif_data["VIF"] = [variance_inflation_factor(X_scaled_const.values, i) for i in range(X_scaled_const.shape[1])]
    vif_data = vif_data.sort_values(by="VIF", ascending=False)
    logger.info("📈 VIF Analysis Results:")
    logger.info(vif_data.to_string())
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.3, random_state=42)
    logger.info(f"📊 Train set: {X_train.shape}, Test set: {X_test.shape}")
    
    # Create models directory if it doesn't exist
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    
    # 1. LOGISTIC REGRESSION
    logger.info("\n" + "="*50)
    logger.info("🤖 Training LOGISTIC REGRESSION")
    logger.info("="*50)
    
    logit_model = LogisticRegression(solver='liblinear', max_iter=1000, random_state=42)
    logit_model.fit(X_train, y_train)
    
    # Save logistic regression model
    logit_path = models_dir / "logistic_regression_model.pkl"
    with open(logit_path, 'wb') as f:
        pickle.dump(logit_model, f)
    logger.info(f"💾 Logistic regression model saved to {logit_path}")
    
    # Evaluate
    y_pred_logit = logit_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred_logit)
    logger.info(f"📊 Test Set Accuracy: {accuracy:.4f}")
    logger.info(f"📊 Classification Report:\n{classification_report(y_test, y_pred_logit)}")
    
    # Coefficients
    coefficients = pd.DataFrame({
        'Feature': X_train.columns,
        'Coefficient': logit_model.coef_[0]
    }).sort_values(by='Coefficient', key=abs, ascending=False)
    logger.info(f"📊 Top 10 Logistic Regression Coefficients:\n{coefficients.head(10)}")
    
    # 2. DECISION TREE
    logger.info("\n" + "="*50)
    logger.info("🌳 Training DECISION TREE")
    logger.info("="*50)
    
    dt_model = DecisionTreeClassifier(max_depth=5, random_state=42)
    dt_model.fit(X_train, y_train)
    
    # Save Decision Tree model
    dt_path = models_dir / "decision_tree_model.pkl"
    with open(dt_path, 'wb') as f:
        pickle.dump(dt_model, f)
    logger.info(f"💾 Decision Tree model saved to {dt_path}")
    
    # Evaluate
    y_pred_dt = dt_model.predict(X_test)
    accuracy_dt = accuracy_score(y_test, y_pred_dt)
    logger.info(f"📊 Test Set Accuracy: {accuracy_dt:.4f}")
    logger.info(f"📊 Classification Report:\n{classification_report(y_test, y_pred_dt)}")
    
    # Feature importance
    feature_importance_dt = pd.DataFrame({
        'Feature': X_train.columns,
        'Importance': dt_model.feature_importances_
    }).sort_values(by='Importance', ascending=False)
    logger.info(f"📊 Top 10 Decision Tree Feature Importances:\n{feature_importance_dt.head(10)}")
    
    # 3. RANDOM FOREST
    logger.info("\n" + "="*50)
    logger.info("🌲 Training RANDOM FOREST")
    logger.info("="*50)
    
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    rf_model.fit(X_train, y_train)
    
    # Save Random Forest model
    rf_path = models_dir / "random_forest_model.pkl"
    with open(rf_path, 'wb') as f:
        pickle.dump(rf_model, f)
    logger.info(f"💾 Random Forest model saved to {rf_path}")
    
    # Evaluate
    y_pred_rf = rf_model.predict(X_test)
    accuracy_rf = accuracy_score(y_test, y_pred_rf)
    logger.info(f"📊 Test Set Accuracy: {accuracy_rf:.4f}")
    logger.info(f"📊 Classification Report:\n{classification_report(y_test, y_pred_rf)}")
    
    # Feature importances
    feature_importance_rf = pd.DataFrame({
        'Feature': X_train.columns,
        'Importance': rf_model.feature_importances_
    }).sort_values(by='Importance', ascending=False)
    logger.info(f"📊 Top 10 Random Forest Feature Importances:\n{feature_importance_rf.head(10)}")
    
    # 4. XGBOOST
    logger.info("\n" + "="*50)
    logger.info("🚀 Training XGBOOST")
    logger.info("="*50)
    
    xgb_model = XGBClassifier(use_label_encoder=False, eval_metric='logloss', 
                             max_depth=5, n_estimators=100, random_state=42)
    xgb_model.fit(X_train, y_train)
    
    # Save XGBoost model
    xgb_path = models_dir / "xgboost_model.pkl"
    with open(xgb_path, 'wb') as f:
        pickle.dump(xgb_model, f)
    logger.info(f"💾 XGBoost model saved to {xgb_path}")
    
    # Evaluate
    y_pred_xgb = xgb_model.predict(X_test)
    accuracy_xgb = accuracy_score(y_test, y_pred_xgb)
    logger.info(f"📊 Test Set Accuracy: {accuracy_xgb:.4f}")
    logger.info(f"📊 Classification Report:\n{classification_report(y_test, y_pred_xgb)}")
    
    # Feature importances
    feature_importance_xgb = pd.DataFrame({
        'Feature': X_train.columns,
        'Importance': xgb_model.feature_importances_
    }).sort_values(by='Importance', ascending=False)
    logger.info(f"📊 Top 10 XGBoost Feature Importances:\n{feature_importance_xgb.head(10)}")
    
    # Save scaler and model info
    scaler = StandardScaler()
    scaler.fit(df[scale_features])
    
    scaler_path = models_dir / "scaler.pkl"
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    logger.info(f"💾 Scaler saved to {scaler_path}")
    
    # Save model info
    model_info = {
        'predictors': predictors,
        'scale_features': scale_features,
        'leave_unscaled': leave_unscaled,
        'model_performance': {
            'logistic_regression': accuracy,
            'decision_tree': accuracy_dt,
            'random_forest': accuracy_rf,
            'xgboost': accuracy_xgb
        }
    }
    
    model_info_path = models_dir / "model_info.pkl"
    with open(model_info_path, 'wb') as f:
        pickle.dump(model_info, f)
    logger.info(f"💾 Model info saved to {model_info_path}")
    
    # Summary
    logger.info("\n" + "="*50)
    logger.info("🎉 TRAINING COMPLETE!")
    logger.info("="*50)
    logger.info("📁 Saved files:")
    logger.info(f"   - {scaler_path}")
    logger.info(f"   - {logit_path}")
    logger.info(f"   - {dt_path}")
    logger.info(f"   - {rf_path}")
    logger.info(f"   - {xgb_path}")
    logger.info(f"   - {model_info_path}")
    
    logger.info("\n📊 Model Performance Summary:")
    logger.info(f"   - Logistic Regression: {accuracy:.4f}")
    logger.info(f"   - Decision Tree: {accuracy_dt:.4f}")
    logger.info(f"   - Random Forest: {accuracy_rf:.4f}")
    logger.info(f"   - XGBoost: {accuracy_xgb:.4f}")
    
    return model_info

if __name__ == "__main__":
    train_ml_models() 