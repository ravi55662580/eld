#!/usr/bin/env python3
import pandas as pd
import json
from datetime import datetime
import uuid

def parse_eld_data():
    # Read the CSV file, skipping the header rows
    df = pd.read_csv('driver_records.csv', skiprows=5)  # Skip first 5 rows (headers and carrier info)
    
    print("=== ELD DRIVER RECORDS ANALYSIS ===")
    print(f"Carrier: FNE TRANSPORT LLC")
    print(f"DOT Number: 4345433")
    print(f"Date Range: 8/15/2025 - 8/15/2025")
    print(f"Total Records: {len(df)}")
    print()
    
    # Clean column names
    df.columns = [
        'ELD_ID',
        'App_Version',
        'Timestamp_EDT',
        'CoDriver',
        'Tractor_Number',
        'Engine_Hours',
        'Odometer_Miles',
        'New_Status',
        'Location',
        'Latitude',
        'Longitude',
        'Event_Status',
        'Event_Origin',
        'Event_Type',
        'Event_Code',
        'Verified_Timestamp_EDT',
        'DM_Code'
    ]
    
    print("=== COLUMN ANALYSIS ===")
    for col in df.columns:
        unique_count = df[col].nunique()
        print(f"{col}: {unique_count} unique values")
        if unique_count <= 10:
            unique_vals = df[col].dropna().unique()[:10]
            print(f"  Sample values: {unique_vals}")
        print()
    
    # Analyze duty status changes
    duty_statuses = df['New_Status'].value_counts()
    print("=== DUTY STATUS DISTRIBUTION ===")
    print(duty_statuses)
    print()
    
    # Analyze unique drivers/trucks
    unique_elds = df['ELD_ID'].nunique()
    unique_tractors = df['Tractor_Number'].nunique()
    
    print(f"=== SUMMARY ===")
    print(f"Unique ELD Devices: {unique_elds}")
    print(f"Unique Tractors: {unique_tractors}")
    print(f"Date Range: {df['Timestamp_EDT'].min()} to {df['Timestamp_EDT'].max()}")
    print()
    
    # Generate seed data for your ELD system
    generate_seed_data(df)

def generate_seed_data(df):
    """Generate seed data for the ELD backend system"""
    
    print("=== GENERATING SEED DATA ===")
    
    # Create carrier data
    carrier_data = {
        "_id": str(uuid.uuid4()),
        "name": "FNE TRANSPORT LLC",
        "dotNumber": "4345433",
        "mcNumber": "",
        "businessType": "FOR_HIRE_CARRIER",
        "address": {
            "street": "",
            "city": "",
            "state": "TX",  # Based on location data showing Texas
            "zipCode": "",
            "country": "US"
        },
        "contactInfo": {
            "phone": "",
            "email": "",
            "website": ""
        },
        "isActive": True,
        "safetyRating": "SATISFACTORY"
    }
    
    # Extract unique tractors and create asset data
    unique_tractors = df['Tractor_Number'].dropna().unique()
    assets_data = []
    
    for tractor_num in unique_tractors:
        asset = {
            "_id": str(uuid.uuid4()),
            "carrierId": carrier_data["_id"],
            "type": "VEHICLE",
            "vehicleNumber": str(tractor_num),
            "vin": f"1FUJA6CV{tractor_num}000000",  # Mock VIN
            "year": 2020,
            "make": "FREIGHTLINER",
            "model": "CASCADIA",
            "eldDeviceId": df[df['Tractor_Number'] == tractor_num]['ELD_ID'].iloc[0],
            "status": "ACTIVE",
            "specifications": {
                "grossVehicleWeight": 80000,
                "engineType": "DIESEL",
                "fuelCapacity": 200
            }
        }
        assets_data.append(asset)
    
    # Create driver data (since no driver names in data, create mock driver)
    driver_data = {
        "_id": str(uuid.uuid4()),
        "carrierId": carrier_data["_id"],
        "firstName": "John",
        "lastName": "Driver",
        "licenseNumber": "TX123456789",
        "licenseState": "TX",
        "licenseExpiration": "2026-12-31",
        "eldUsername": "jdriver",
        "status": "ACTIVE",
        "medicalCertification": {
            "certificationType": "DOT_PHYSICAL",
            "expirationDate": "2026-06-30"
        }
    }
    
    # Create log book entries from the ELD data
    log_books = []
    current_date = None
    current_log = None
    
    # Sort by timestamp to process chronologically
    df_sorted = df.sort_values('Timestamp_EDT')
    
    for _, row in df_sorted.iterrows():
        try:
            timestamp = pd.to_datetime(row['Timestamp_EDT'])
            log_date = timestamp.date()
            
            # Create new log book for new date
            if current_date != log_date:
                if current_log:
                    log_books.append(current_log)
                
                current_date = log_date
                current_log = {
                    "_id": str(uuid.uuid4()),
                    "carrierId": carrier_data["_id"],
                    "driverId": driver_data["_id"],
                    "vehicleId": next((a["_id"] for a in assets_data if a["vehicleNumber"] == str(row['Tractor_Number'])), None),
                    "logDate": timestamp.strftime("%Y-%m-%d"),
                    "dutyEvents": [],
                    "status": "ACTIVE"
                }
            
            # Add duty event if it's a duty status change
            if pd.notna(row['New_Status']) and row['New_Status'] in ['ON', 'OFF', 'D', 'SB']:
                duty_status_map = {
                    'ON': 'ON_DUTY',
                    'OFF': 'OFF_DUTY', 
                    'D': 'DRIVING',
                    'SB': 'SLEEPER_BERTH'
                }
                
                if row['New_Status'] in duty_status_map:
                    duty_event = {
                        "_id": str(uuid.uuid4()),
                        "timestamp": timestamp.isoformat(),
                        "status": duty_status_map[row['New_Status']],
                        "location": {
                            "latitude": float(row['Latitude']) if pd.notna(row['Latitude']) else None,
                            "longitude": float(row['Longitude']) if pd.notna(row['Longitude']) else None,
                            "address": row['Location'] if pd.notna(row['Location']) else None
                        },
                        "odometer": int(float(row['Odometer_Miles'])) if pd.notna(row['Odometer_Miles']) else None,
                        "engineHours": float(row['Engine_Hours']) if pd.notna(row['Engine_Hours']) else None,
                        "source": "ELD",
                        "eldRecordId": row['ELD_ID']
                    }
                    current_log["dutyEvents"].append(duty_event)
                    
        except Exception as e:
            print(f"Error processing row: {e}")
            continue
    
    # Add the last log book
    if current_log:
        log_books.append(current_log)
    
    # Create the complete seed data structure
    seed_data = {
        "carrier": carrier_data,
        "drivers": [driver_data],
        "assets": assets_data,
        "logBooks": log_books,
        "metadata": {
            "source": "ELD_IMPORT",
            "originalFile": "FNE TRANSPORT LLC_DriverRecords_2025094153348.xlsx",
            "importDate": datetime.now().isoformat(),
            "totalRecords": len(df),
            "dateRange": {
                "start": df['Timestamp_EDT'].min(),
                "end": df['Timestamp_EDT'].max()
            }
        }
    }
    
    # Save seed data
    with open('eld_seed_data.json', 'w') as f:
        json.dump(seed_data, f, indent=2, default=str)
    
    print(f"✅ Generated seed data:")
    print(f"   - 1 Carrier")
    print(f"   - 1 Driver") 
    print(f"   - {len(assets_data)} Assets (Tractors)")
    print(f"   - {len(log_books)} Log Books")
    print(f"   - {sum(len(log['dutyEvents']) for log in log_books)} Duty Events")
    print(f"   - Saved to: eld_seed_data.json")
    
    # Create MongoDB import script
    create_import_script(seed_data)

def create_import_script(seed_data):
    """Create a MongoDB import script"""
    
    script_content = f'''
// MongoDB Import Script for ELD Data
// Generated from FNE TRANSPORT LLC driver records

// Connect to your MongoDB database
use eld_database

// Insert Carrier
db.carriers.insertOne({json.dumps(seed_data['carrier'], indent=2)});

// Insert Drivers  
db.drivers.insertMany({json.dumps(seed_data['drivers'], indent=2)});

// Insert Assets
db.assets.insertMany({json.dumps(seed_data['assets'], indent=2)});

// Insert Log Books
db.logbooks.insertMany({json.dumps(seed_data['logBooks'], indent=2, default=str)});

print("✅ ELD data imported successfully!");
print("Carrier: FNE TRANSPORT LLC");
print("Assets: {len(seed_data['assets'])}");
print("Log Books: {len(seed_data['logBooks'])}");
print("Total Duty Events: {sum(len(log['dutyEvents']) for log in seed_data['logBooks'])}");
'''
    
    with open('import_eld_data.js', 'w') as f:
        f.write(script_content)
    
    print(f"✅ Created MongoDB import script: import_eld_data.js")

if __name__ == "__main__":
    parse_eld_data()
