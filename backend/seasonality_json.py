#!/usr/bin/env python3
"""
Seasonality Analysis Data Generator for Frontend Dashboard
This script analyzes the FinancialDB.xlsx file and generates a JSON data structure
for the seasonality analysis dashboard presentation.
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime
import warnings
from scipy import stats
from pathlib import Path

warnings.filterwarnings('ignore')

class SeasonalityAnalysisGenerator:
    def __init__(self, file_path='FinancialDB.xlsx'):
        self.file_path = file_path
        self.df = None
        self.results = {
            "metadata": {},
            "summary": {},
            "distributions": {},
            "trends": {},
            "insights": {},
            "visualizations": {}
        }
    
    def convert_to_native_type(self, obj):
        """Convert NumPy types to native Python types for JSON serialization"""
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.bool_):
            return bool(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif pd.isna(obj):
            return None
        else:
            return obj
    
    def load_and_prepare_data(self):
        """Load Excel file and prepare data for analysis"""
        print("Loading financial data...")
        
        # Load the Excel file
        self.df = pd.read_excel(self.file_path, sheet_name=0)
        
        # Print available columns for debugging
        print("Available columns:", list(self.df.columns))
        
        # Try to find the date column (handle different possible names)
        date_column = None
        possible_date_columns = ['Announced Date', 'AnnouncedDate', 'Date', 'announced_date', 
                                'Announcement Date', 'Date Announced']
        
        for col in self.df.columns:
            if any(possible_name.lower() in col.lower() for possible_name in ['announced', 'date']):
                date_column = col
                print(f"Found date column: '{date_column}'")
                break
        
        if date_column is None:
            raise ValueError("Could not find a date column. Available columns: " + str(list(self.df.columns)))
        
        # Convert to datetime
        self.df['Announced Date'] = pd.to_datetime(self.df[date_column], errors='coerce')
        
        # Remove rows with invalid dates
        initial_count = len(self.df)
        self.df = self.df.dropna(subset=['Announced Date'])
        final_count = len(self.df)
        
        # Extract temporal features
        self.df['Year'] = self.df['Announced Date'].dt.year
        self.df['Month'] = self.df['Announced Date'].dt.month
        self.df['Quarter'] = self.df['Announced Date'].dt.quarter
        self.df['Day_of_Week'] = self.df['Announced Date'].dt.dayofweek
        self.df['Day_of_Year'] = self.df['Announced Date'].dt.dayofyear
        self.df['Week_of_Year'] = self.df['Announced Date'].dt.isocalendar().week
        self.df['Month_Name'] = self.df['Announced Date'].dt.month_name()
        self.df['Day_Name'] = self.df['Announced Date'].dt.day_name()
        self.df['Quarter_Name'] = 'Q' + self.df['Quarter'].astype(str)
        
        # Create season
        def get_season(month):
            if month in [12, 1, 2]:
                return 'Winter'
            elif month in [3, 4, 5]:
                return 'Spring'
            elif month in [6, 7, 8]:
                return 'Summer'
            else:
                return 'Fall'
        
        self.df['Season'] = self.df['Month'].apply(get_season)
        
        # Store metadata
        self.results['metadata'] = {
            'total_records': int(final_count),
            'removed_records': int(initial_count - final_count),
            'date_range': {
                'start': self.df['Announced Date'].min().strftime('%Y-%m-%d'),
                'end': self.df['Announced Date'].max().strftime('%Y-%m-%d')
            },
            'years_covered': int(self.df['Year'].max() - self.df['Year'].min() + 1)
        }
        
        print(f"Loaded {final_count} valid records from {self.df['Year'].min()} to {self.df['Year'].max()}")
    
    def calculate_summary_statistics(self):
        """Calculate key summary statistics"""
        print("Calculating summary statistics...")
        
        # Peak periods
        monthly_counts = self.df['Month_Name'].value_counts()
        quarterly_counts = self.df['Quarter_Name'].value_counts()
        seasonal_counts = self.df['Season'].value_counts()
        dow_counts = self.df['Day_Name'].value_counts()
        yearly_counts = self.df['Year'].value_counts()
        
        self.results['summary'] = {
            'total_announcements': int(len(self.df)),
            'date_range': self.results['metadata']['date_range'],
            'peak_periods': {
                'month': {
                    'name': str(monthly_counts.index[0]),
                    'count': int(monthly_counts.iloc[0]),
                    'percentage': round(float(monthly_counts.iloc[0] / len(self.df) * 100), 1)
                },
                'quarter': {
                    'name': str(quarterly_counts.index[0]),
                    'count': int(quarterly_counts.iloc[0]),
                    'percentage': round(float(quarterly_counts.iloc[0] / len(self.df) * 100), 1)
                },
                'season': {
                    'name': str(seasonal_counts.index[0]),
                    'count': int(seasonal_counts.iloc[0]),
                    'percentage': round(float(seasonal_counts.iloc[0] / len(self.df) * 100), 1)
                },
                'day': {
                    'name': str(dow_counts.index[0]),
                    'count': int(dow_counts.iloc[0]),
                    'percentage': round(float(dow_counts.iloc[0] / len(self.df) * 100), 1)
                },
                'year': {
                    'name': str(int(yearly_counts.index[0])),
                    'count': int(yearly_counts.iloc[0])
                }
            }
        }
    
    def calculate_distributions(self):
        """Calculate various temporal distributions"""
        print("Calculating distributions...")
        
        # Monthly distribution
        monthly_order = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December']
        monthly_counts = self.df.groupby('Month_Name').size().reindex(monthly_order, fill_value=0)
        
        self.results['distributions']['monthly'] = []
        for month, count in monthly_counts.items():
            self.results['distributions']['monthly'].append({
                'month': month[:3],  # Short month name
                'fullMonth': month,
                'count': int(count),
                'percentage': round(float(count / len(self.df) * 100), 1)
            })
        
        # Quarterly distribution
        quarterly_counts = self.df['Quarter_Name'].value_counts().sort_index()
        self.results['distributions']['quarterly'] = []
        for quarter, count in quarterly_counts.items():
            self.results['distributions']['quarterly'].append({
                'quarter': str(quarter),
                'count': int(count),
                'percentage': round(float(count / len(self.df) * 100), 1)
            })
        
        # Seasonal distribution
        season_order = ['Spring', 'Summer', 'Fall', 'Winter']
        seasonal_counts = self.df['Season'].value_counts().reindex(season_order, fill_value=0)
        self.results['distributions']['seasonal'] = []
        for season, count in seasonal_counts.items():
            self.results['distributions']['seasonal'].append({
                'season': season,
                'count': int(count),
                'percentage': round(float(count / len(self.df) * 100), 1)
            })
        
        # Day of week distribution
        dow_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        dow_counts = self.df['Day_Name'].value_counts().reindex(dow_order, fill_value=0)
        self.results['distributions']['dayOfWeek'] = []
        for day, count in dow_counts.items():
            self.results['distributions']['dayOfWeek'].append({
                'day': day[:3],  # Short day name
                'fullDay': day,
                'count': int(count),
                'percentage': round(float(count / len(self.df) * 100), 1)
            })
        
        # Business days analysis
        weekday_count = int(self.df[self.df['Day_of_Week'] < 5].shape[0])
        weekend_count = int(self.df[self.df['Day_of_Week'] >= 5].shape[0])
        self.results['distributions']['businessDays'] = {
            'weekdays': {
                'count': weekday_count,
                'percentage': round(float(weekday_count / len(self.df) * 100), 1)
            },
            'weekends': {
                'count': weekend_count,
                'percentage': round(float(weekend_count / len(self.df) * 100), 1)
            }
        }
    
    def calculate_trends(self):
        """Calculate yearly trends and moving averages"""
        print("Calculating trends...")
        
        # Yearly trend
        yearly_counts = self.df.groupby('Year').size()
        self.results['trends']['yearly'] = []
        prev_count = None
        
        for year, count in yearly_counts.items():
            growth_rate = None
            if prev_count is not None and prev_count > 0:
                growth_rate = round(float((count - prev_count) / prev_count * 100), 1)
            
            self.results['trends']['yearly'].append({
                'year': int(year),
                'count': int(count),
                'growthRate': growth_rate
            })
            prev_count = count
        
        # Calculate CAGR
        first_year_count = yearly_counts.iloc[0]
        last_year_count = yearly_counts.iloc[-1]
        years = len(yearly_counts) - 1
        if years > 0 and first_year_count > 0:
            cagr = (pow(last_year_count / first_year_count, 1/years) - 1) * 100
            self.results['trends']['cagr'] = round(float(cagr), 2)
        
        # Monthly time series for moving averages
        daily_counts = self.df.groupby(self.df['Announced Date'].dt.date).size()
        daily_counts.index = pd.to_datetime(daily_counts.index)
        
        # Fill missing dates with 0
        date_range = pd.date_range(start=daily_counts.index.min(), 
                                  end=daily_counts.index.max(), freq='D')
        daily_counts = daily_counts.reindex(date_range, fill_value=0)
        
        # Calculate moving averages
        ma7 = daily_counts.rolling(window=7, center=True).mean()
        ma30 = daily_counts.rolling(window=30, center=True).mean()
        
        # Sample data points for visualization (weekly samples)
        sample_dates = pd.date_range(start=daily_counts.index.min(),
                                    end=daily_counts.index.max(), freq='W')
        
        self.results['trends']['movingAverages'] = {
            'dates': [d.strftime('%Y-%m-%d') for d in sample_dates],
            'daily': [int(daily_counts[d]) if d in daily_counts.index else 0 for d in sample_dates],
            'ma7': [round(float(ma7[d]), 2) if d in ma7.index and not pd.isna(ma7[d]) else None for d in sample_dates],
            'ma30': [round(float(ma30[d]), 2) if d in ma30.index and not pd.isna(ma30[d]) else None for d in sample_dates]
        }
    
    def calculate_statistical_insights(self):
        """Calculate statistical tests and insights"""
        print("Calculating statistical insights...")
        
        # Chi-square tests for seasonality
        # Monthly test
        monthly_counts = self.df['Month'].value_counts().sort_index()
        expected_monthly = [len(self.df) / 12] * 12
        chi2_month, p_value_month = stats.chisquare(monthly_counts.values, expected_monthly)
        
        # Quarterly test
        quarterly_counts = self.df['Quarter'].value_counts().sort_index()
        expected_quarterly = [len(self.df) / 4] * 4
        chi2_quarter, p_value_quarter = stats.chisquare(quarterly_counts.values, expected_quarterly)
        
        # Seasonal test
        seasonal_counts = self.df['Season'].value_counts()
        expected_seasonal = [len(self.df) / 4] * 4
        chi2_season, p_value_season = stats.chisquare(seasonal_counts.values, expected_seasonal)
        
        # Day of week test
        dow_counts = self.df['Day_of_Week'].value_counts().sort_index()
        expected_dow = [len(self.df) / 7] * 7
        chi2_dow, p_value_dow = stats.chisquare(dow_counts.values, expected_dow)
        
        self.results['insights']['statisticalTests'] = {
            'monthly': {
                'chi2': round(float(chi2_month), 2),
                'pValue': round(float(p_value_month), 4),
                'significant': bool(p_value_month < 0.05)
            },
            'quarterly': {
                'chi2': round(float(chi2_quarter), 2),
                'pValue': round(float(p_value_quarter), 4),
                'significant': bool(p_value_quarter < 0.05)
            },
            'seasonal': {
                'chi2': round(float(chi2_season), 2),
                'pValue': round(float(p_value_season), 4),
                'significant': bool(p_value_season < 0.05)
            },
            'dayOfWeek': {
                'chi2': round(float(chi2_dow), 2),
                'pValue': round(float(p_value_dow), 4),
                'significant': bool(p_value_dow < 0.05)
            }
        }
        
        # Calculate seasonal indices
        monthly_avg = len(self.df) / 12
        seasonal_indices = {}
        
        for month in range(1, 13):
            month_count = len(self.df[self.df['Month'] == month])
            index = (month_count / monthly_avg) * 100
            month_name = pd.to_datetime(f'2000-{month:02d}-01').strftime('%B')
            seasonal_indices[month_name] = round(float(index), 1)
        
        self.results['insights']['seasonalIndices'] = seasonal_indices
        
        # Key insights
        peak_month = self.results['summary']['peak_periods']['month']['name']
        trough_month = min(self.results['distributions']['monthly'], 
                          key=lambda x: x['count'])['fullMonth']
        
        peak_count = max(x['count'] for x in self.results['distributions']['monthly'])
        trough_count = min(x['count'] for x in self.results['distributions']['monthly'])
        seasonality_strength = round(float((peak_count - trough_count) / (len(self.df) / 12) * 100), 1)
        
        self.results['insights']['keyFindings'] = {
            'seasonalityStrength': f"{seasonality_strength}% variation between peak and trough",
            'businessDayPreference': f"{self.results['distributions']['businessDays']['weekdays']['percentage']}% on weekdays",
            'peakTroughRatio': round(float(peak_count / trough_count) if trough_count > 0 else 0, 2),
            'mostActiveMonth': peak_month,
            'leastActiveMonth': trough_month,
            'yearlyGrowthTrend': 'Positive' if self.results['trends'].get('cagr', 0) > 0 else 'Negative'
        }
    
    def prepare_visualization_data(self):
        """Prepare data specifically formatted for visualizations"""
        print("Preparing visualization data...")
        
        # Heatmap data: Year vs Month
        heatmap_data = []
        year_month_pivot = self.df.pivot_table(
            values='Announced Date',
            index='Year',
            columns='Month',
            aggfunc='count',
            fill_value=0
        )
        
        for year in year_month_pivot.index:
            for month in range(1, 13):
                if month in year_month_pivot.columns:
                    count = int(year_month_pivot.loc[year, month])
                else:
                    count = 0
                
                heatmap_data.append({
                    'year': int(year),
                    'month': int(month),
                    'monthName': pd.to_datetime(f'2000-{month:02d}-01').strftime('%b'),
                    'count': count
                })
        
        self.results['visualizations']['heatmap'] = heatmap_data
        
        # Radar chart data for seasonal indices
        radar_data = []
        for month, index in self.results['insights']['seasonalIndices'].items():
            radar_data.append({
                'month': month[:3],
                'index': float(index),
                'average': 100  # Reference line
            })
        
        self.results['visualizations']['seasonalRadar'] = radar_data
        
        # Box plot data by quarter
        boxplot_data = []
        for quarter in range(1, 5):
            quarter_data = self.df[self.df['Quarter'] == quarter].groupby('Year').size()
            if len(quarter_data) > 0:
                boxplot_data.append({
                    'quarter': f'Q{quarter}',
                    'min': int(quarter_data.min()),
                    'q1': int(quarter_data.quantile(0.25)),
                    'median': int(quarter_data.median()),
                    'q3': int(quarter_data.quantile(0.75)),
                    'max': int(quarter_data.max()),
                    'mean': round(float(quarter_data.mean()), 1)
                })
        
        self.results['visualizations']['quarterlyBoxplot'] = boxplot_data
        
        # Industry analysis (if available)
        if 'Industries' in self.df.columns:
            industry_counts = self.df['Industries'].value_counts().head(10)
            industry_data = []
            for industry, count in industry_counts.items():
                if pd.notna(industry):
                    industry_data.append({
                        'industry': str(industry)[:50],  # Truncate long names
                        'count': int(count),
                        'percentage': round(float(count / len(self.df) * 100), 1)
                    })
            
            self.results['distributions']['topIndustries'] = industry_data
    
    def generate_json_output(self):
        """Generate the final JSON output"""
        output_path = Path('frontend/src/data')
        output_path.mkdir(parents=True, exist_ok=True)
        
        output_file = output_path / 'seasonal_findings.json'
        
        # Convert all NumPy types to native Python types
        def convert_dict(d):
            if isinstance(d, dict):
                return {k: convert_dict(v) for k, v in d.items()}
            elif isinstance(d, list):
                return [convert_dict(item) for item in d]
            else:
                return self.convert_to_native_type(d)
        
        # Convert the entire results dictionary
        converted_results = convert_dict(self.results)
        
        with open(output_file, 'w') as f:
            json.dump(converted_results, f, indent=2)
        
        print(f"\n✅ JSON data generated successfully!")
        print(f"📁 Output saved to: {output_file}")
        
        # Also save a copy to the current directory for verification
        with open('seasonal_findings.json', 'w') as f:
            json.dump(converted_results, f, indent=2)
        
        print(f"📁 Copy saved to: seasonal_findings.json")
    
    def run_analysis(self):
        """Run the complete analysis pipeline"""
        print("="*60)
        print("SEASONALITY ANALYSIS DATA GENERATOR")
        print("="*60)
        
        self.load_and_prepare_data()
        self.calculate_summary_statistics()
        self.calculate_distributions()
        self.calculate_trends()
        self.calculate_statistical_insights()
        self.prepare_visualization_data()
        self.generate_json_output()
        
        print("\n" + "="*60)
        print("ANALYSIS COMPLETE")
        print("="*60)
        print(f"Total announcements analyzed: {self.results['summary']['total_announcements']}")
        print(f"Date range: {self.results['summary']['date_range']['start']} to {self.results['summary']['date_range']['end']}")
        print(f"Peak month: {self.results['summary']['peak_periods']['month']['name']} ({self.results['summary']['peak_periods']['month']['percentage']}%)")
        print(f"Seasonality strength: {self.results['insights']['keyFindings']['seasonalityStrength']}")


def main():
    """Main execution function"""
    # Check if the Excel file exists
    file_path = 'FinancialDB.xlsx'
    if not Path(file_path).exists():
        print(f"❌ Error: {file_path} not found!")
        print("Please ensure the FinancialDB.xlsx file is in the current directory.")
        return
    
    # Run the analysis
    analyzer = SeasonalityAnalysisGenerator(file_path)
    analyzer.run_analysis()


if __name__ == "__main__":
    main()