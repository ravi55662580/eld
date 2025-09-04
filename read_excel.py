#!/usr/bin/env python3
import pandas as pd
import json
import sys

def read_excel_file(filename):
    try:
        # Read the Excel file
        print(f"Reading Excel file: {filename}")
        
        # Try to read all sheets first to see what's available
        excel_file = pd.ExcelFile(filename)
        print(f"Available sheets: {excel_file.sheet_names}")
        
        # Read the first sheet (or all sheets if multiple)
        if len(excel_file.sheet_names) == 1:
            df = pd.read_excel(filename)
            print(f"\nData shape: {df.shape} (rows x columns)")
            print(f"\nColumn names:")
            for i, col in enumerate(df.columns):
                print(f"  {i+1}. {col}")
            
            print(f"\nFirst few rows:")
            print(df.head().to_string())
            
            print(f"\nData types:")
            print(df.dtypes.to_string())
            
            # Convert to JSON for easier handling
            json_data = df.to_json(orient='records', indent=2, date_format='iso')
            
            # Save as JSON file
            with open('driver_records.json', 'w') as f:
                f.write(json_data)
            
            # Save as CSV file
            df.to_csv('driver_records.csv', index=False)
            
            print(f"\nFiles created:")
            print(f"  - driver_records.json")
            print(f"  - driver_records.csv")
            
            return df
            
        else:
            # Multiple sheets
            all_data = {}
            for sheet_name in excel_file.sheet_names:
                print(f"\n--- Sheet: {sheet_name} ---")
                df = pd.read_excel(filename, sheet_name=sheet_name)
                print(f"Shape: {df.shape}")
                print(f"Columns: {list(df.columns)}")
                print(f"First few rows:")
                print(df.head(3).to_string())
                all_data[sheet_name] = df
            
            return all_data
            
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        print("Trying to install required dependencies...")
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "pandas", "openpyxl", "xlrd"])
        print("Please run the script again after installing dependencies.")
        return None

if __name__ == "__main__":
    filename = "FNE TRANSPORT LLC_DriverRecords_2025094153348.xlsx"
    data = read_excel_file(filename)
