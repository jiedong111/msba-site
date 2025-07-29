# MSBA Data Analysis Dashboard

A full-stack data analysis dashboard with CSV analysis and sentiment analysis capabilities.

## Project Structure

```
msba-application/
├── backend/          # FastAPI backend
├── frontend/         # React + Vite frontend
└── react-bits/       # UI component library
```

## Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a sample ML model:
```bash
python create_sample_model.py
```

5. Start the backend server:
```bash
uvicorn main:app --reload
```

The backend will be available at http://localhost:8000

### Frontend Setup

1. In a new terminal, navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173

## Features

### 1. CSV Analysis
- Upload CSV files via drag-and-drop
- Load ML models from .pkl files
- Display predictions with charts and statistics
- Beautiful visualizations using Recharts

### 2. Sentiment Analysis
- Enter company name for analysis
- Web search integration (uses mock data if no API key)
- Sentiment score calculation
- Risk level assessment
- Display contributing factors

## API Keys (Optional)

To use real web search and AI analysis, add these to `backend/.env`:

```
OPENAI_API_KEY=your_openai_key
SERPER_API_KEY=your_serper_key
```

Without API keys, the app uses mock data for demo purposes.

## Testing the Application

### CSV Analysis
1. Create a sample CSV with 5 numeric columns
2. Upload it on the CSV Analysis page
3. Use "model" as the model name (default)

### Sentiment Analysis
1. Enter any company name
2. Click Analyze Sentiment
3. View the sentiment score and risk assessment

## Technologies Used

- **Backend**: FastAPI, pandas, scikit-learn, joblib
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **UI Components**: react-bits (Aurora background, glass morphism)
- **Charts**: Recharts
- **Icons**: Lucide React