# Test Data Generation and Model Testing

This directory contains scripts for generating test data and testing model predictions.

## Scripts

### 1. `generate_test_data.py`
Generates synthetic test data that matches the structure of `riskDBv4.csv`.

**Usage:**
```bash
# Generate 50 samples (default)
python generate_test_data.py

# Generate custom number of samples
python generate_test_data.py 100
```

**Output:**
- `test_data_generated.csv` - Generated test data file

### 2. `test_model_predictions.py`
Tests all available models with generated data and provides detailed analysis.

**Usage:**
```bash
# Test with 20 samples (default)
python test_model_predictions.py

# Test with custom number of samples
python test_model_predictions.py 50
```

**Output:**
- `test_predictions_data.csv` - Input test data used
- `predictions_{model_name}.csv` - Predictions for each model

## Features Generated

The test data includes all features from `riskDBv4.csv`:
- Company information (name, industries, location)
- Financial metrics (funding, investors)
- Innovation metrics (patents, trademarks)
- Activity metrics (events, articles)
- Ecosystem ratings (1-5 scale ratings)
- Binary flags (high tech, closed, diversity, etc.)

## Model Testing Process

1. Generates synthetic test data
2. Loads each available model
3. Makes predictions on test data
4. Provides detailed statistics:
   - Summary statistics (mean, std, min, max, median)
   - Distribution analysis
   - Risk segmentation
   - Percentiles
5. Saves predictions for each model
6. Compares model outputs

## Example Output

```
🤖 Testing model: random_forest_model
✅ Predictions successful!

📊 Summary Statistics:
  - Count: 20
  - Mean: 0.4523
  - Std: 0.1234
  - Min: 0.2145
  - Max: 0.7891
  - Median: 0.4456

📈 Distribution Insights:
  - Shape: Normal (symmetric)
  - Outliers: 1 (5.0%)

🎯 Risk Segments:
  - Low: 7 (35.0%)
  - Medium: 8 (40.0%)
  - High: 5 (25.0%)
```