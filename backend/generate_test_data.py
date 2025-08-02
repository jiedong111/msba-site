#!/usr/bin/env python3
"""
Generate sample test data similar to riskDBv4.csv for testing model predictions
"""

import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import sys

def generate_test_data(num_samples=50):
    """Generate test data similar to riskDBv4.csv structure"""
    
    # Set random seed for reproducibility
    np.random.seed(42)
    random.seed(42)
    
    # Sample data pools
    industries = [
        "Software", "Hardware", "E-Commerce", "Health Care", "Biotechnology",
        "Real Estate", "Financial Services", "Education", "Food and Beverage",
        "Retail", "Transportation", "Energy", "Media", "Telecommunications",
        "Manufacturing", "Consulting", "Marketing", "Advertising", "Travel",
        "Fashion", "Sports", "Entertainment", "Agriculture", "Aerospace"
    ]
    
    regions = [
        "San Francisco Bay Area", "East Coast", "West Coast", "Great Lakes",
        "Southern US", "Midwest", "Northeast", "Southwest", "Pacific Northwest",
        "Mountain States", "Southeast", "Mid-Atlantic"
    ]
    
    locations = [
        "San Francisco, California, United States",
        "New York, New York, United States",
        "Boston, Massachusetts, United States",
        "Austin, Texas, United States",
        "Seattle, Washington, United States",
        "Chicago, Illinois, United States",
        "Los Angeles, California, United States",
        "Denver, Colorado, United States",
        "Miami, Florida, United States",
        "Portland, Oregon, United States"
    ]
    
    founder_names = [
        "John Smith", "Jane Doe", "Michael Johnson", "Sarah Williams",
        "Robert Brown", "Emily Davis", "David Miller", "Lisa Wilson",
        "James Moore", "Maria Garcia", "William Anderson", "Patricia Martinez"
    ]
    
    # Generate data
    data = []
    for i in range(num_samples):
        # Basic company info
        org_name = f"TestCompany{i+1}"
        company_industries = random.sample(industries, random.randint(1, 3))
        
        # Determine if it's food/restaurant or high tech
        food_dummy = 1 if any(ind in ["Food and Beverage", "Restaurant"] for ind in company_industries) else 0
        tech_dummy = 1 if any(ind in ["Software", "Hardware", "Biotechnology", "Information Technology"] for ind in company_industries) else 0
        
        # Founded date (between 2010 and 2023)
        founded_year = random.randint(2010, 2023)
        founded_date = f"{founded_year}"
        
        # Founders
        num_founders = random.choices([0, 1, 2, 3], weights=[0.1, 0.4, 0.4, 0.1])[0]
        if num_founders == 0:
            founders = "—"
        else:
            founders = ", ".join(random.sample(founder_names, num_founders))
        
        # Investment metrics
        num_investors = random.choices(range(0, 10), weights=[0.1, 0.2, 0.2, 0.15, 0.1, 0.1, 0.05, 0.05, 0.03, 0.02])[0]
        patents = random.choices(range(0, 20), weights=[0.5] + [0.5/19]*19)[0]
        trademarks = random.choices(range(0, 10), weights=[0.4] + [0.6/9]*9)[0]
        
        # Funding
        if num_investors == 0:
            total_funding = random.choice([0, 10000, 50000, 100000])
        else:
            total_funding = random.choice([100000, 500000, 1000000, 2000000, 5000000, 10000000, 20000000, 50000000])
        
        funding_rounds = max(1, min(num_investors, random.randint(1, 5)))
        
        # Other metrics
        closed_dummy = random.choices([0, 1], weights=[0.85, 0.15])[0]
        num_events = random.randint(0, 20)
        num_articles = random.randint(0, 50)
        diversity_dummy = random.choices([0, 1], weights=[0.7, 0.3])[0]
        
        # Website metrics
        page_views = random.uniform(1.0, 10.0)
        
        # Dates
        if closed_dummy:
            close_year = random.randint(founded_year + 1, 2024)
            close_date = f"{close_year}"
        else:
            close_date = ""
        
        announced_date = f"{random.randint(1, 12)}/{random.randint(1, 28)}/{founded_year} 0:00"
        
        # Location dummies
        america_dummy = 1  # All US companies for this test
        asia_dummy = 0
        middle_east_dummy = 0
        
        # Ecosystem ratings (1-7 scale)
        financing = round(random.uniform(3.0, 6.0), 2)
        gov_support = round(random.uniform(2.5, 5.5), 2)
        taxes = round(random.uniform(2.0, 5.0), 2)
        gov_programs = round(random.uniform(3.0, 6.0), 2)
        rd_transfer = round(random.uniform(2.5, 5.5), 2)
        commercial_infra = round(random.uniform(3.5, 6.5), 2)
        market_dynamics = round(random.uniform(3.0, 6.0), 2)
        market_openness = round(random.uniform(3.5, 6.5), 2)
        cultural_norms = round(random.uniform(3.0, 6.0), 2)
        
        # Repeat founder
        repeat_founder = random.choices([0, 1], weights=[0.8, 0.2])[0]
        
        # Create row
        row = {
            "Organization Name": org_name,
            "Industries": ", ".join(company_industries),
            "Food and Restaurant Dummy": food_dummy,
            "High Tech Dummy": tech_dummy,
            "Headquarters Regions": random.choice(regions),
            "Founded Date": founded_date,
            "Founded Date.1": founded_date,
            "Founders": founders,
            "Number of Investors": num_investors,
            "Patents Granted": patents,
            "Trademarks Registered": trademarks,
            "Total Funding Amount": total_funding,
            "Number of Funding Rounds": funding_rounds,
            "Closed Dummy": closed_dummy,
            "Number of Events": num_events,
            "Number of Articles": num_articles,
            "Diversity Spotlight Dummy": diversity_dummy,
            "Page Views / Visit": page_views,
            "Announced Date": announced_date,
            "Headquarters Location": random.choice(locations),
            "Close Date": close_date,
            "Organization Name.1": org_name,
            "America Dummy": america_dummy,
            "Asia Dummy": asia_dummy,
            "Middle East Dummy": middle_east_dummy,
            "Financing for entrepreneurs": financing,
            "Governmental support and policies": gov_support,
            "Taxes and bureaucracy": taxes,
            "Governmental programs": gov_programs,
            "R&D transfer": rd_transfer,
            "Commercial and professional infrastructure": commercial_infra,
            "Internal market dynamics": market_dynamics,
            "Internal market openness": market_openness,
            "Cultural and social norms": cultural_norms,
            "Founders_Cleaned": founders.replace("—", ""),
            "Repeat_Founder": repeat_founder
        }
        
        data.append(row)
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    return df


def main():
    """Generate test data and save to CSV"""
    
    # Parse arguments
    num_samples = 50
    if len(sys.argv) > 1:
        try:
            num_samples = int(sys.argv[1])
        except ValueError:
            print(f"Invalid number of samples: {sys.argv[1]}, using default 50")
    
    print(f"🔄 Generating {num_samples} test samples...")
    
    # Generate data
    df = generate_test_data(num_samples)
    
    # Save to file
    output_file = "test_data_generated.csv"
    df.to_csv(output_file, index=False)
    
    print(f"✅ Test data saved to {output_file}")
    print(f"📊 Data shape: {df.shape}")
    print(f"📋 Columns: {len(df.columns)}")
    
    # Show summary statistics
    print("\n📈 Summary of numeric columns:")
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in ["Number of Investors", "Patents Granted", "Total Funding Amount", "Number of Funding Rounds"]:
        if col in numeric_cols:
            print(f"  {col}:")
            print(f"    Mean: {df[col].mean():.2f}")
            print(f"    Min: {df[col].min()}")
            print(f"    Max: {df[col].max()}")
    
    print("\n🎯 Distribution of key features:")
    print(f"  High Tech companies: {df['High Tech Dummy'].sum()} ({df['High Tech Dummy'].mean()*100:.1f}%)")
    print(f"  Closed companies: {df['Closed Dummy'].sum()} ({df['Closed Dummy'].mean()*100:.1f}%)")
    print(f"  Repeat founders: {df['Repeat_Founder'].sum()} ({df['Repeat_Founder'].mean()*100:.1f}%)")
    
    return df


if __name__ == "__main__":
    main()