
// MongoDB Import Script for ELD Data
// Generated from FNE TRANSPORT LLC driver records

// Connect to your MongoDB database
use eld_database

// Insert Carrier
db.carriers.insertOne({
  "_id": "e277c57a-9594-4081-bc6f-4a4575eb44d4",
  "name": "FNE TRANSPORT LLC",
  "dotNumber": "4345433",
  "mcNumber": "",
  "businessType": "FOR_HIRE_CARRIER",
  "address": {
    "street": "",
    "city": "",
    "state": "TX",
    "zipCode": "",
    "country": "US"
  },
  "contactInfo": {
    "phone": "",
    "email": "",
    "website": ""
  },
  "isActive": true,
  "safetyRating": "SATISFACTORY"
});

// Insert Drivers  
db.drivers.insertMany([
  {
    "_id": "0ddc6275-f992-4fce-a0a9-1e470d60e008",
    "carrierId": "e277c57a-9594-4081-bc6f-4a4575eb44d4",
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
]);

// Insert Assets
db.assets.insertMany([
  {
    "_id": "4a441aa9-c47b-46df-a19f-d0d69f6026a8",
    "carrierId": "e277c57a-9594-4081-bc6f-4a4575eb44d4",
    "type": "VEHICLE",
    "vehicleNumber": "929",
    "vin": "1FUJA6CV929000000",
    "year": 2020,
    "make": "FREIGHTLINER",
    "model": "CASCADIA",
    "eldDeviceId": "7c85348c09a2f640",
    "status": "ACTIVE",
    "specifications": {
      "grossVehicleWeight": 80000,
      "engineType": "DIESEL",
      "fuelCapacity": 200
    }
  }
]);

// Insert Log Books
db.logbooks.insertMany([
  {
    "_id": "89d3e6c5-1fff-403f-b7c4-1f2f1cabf655",
    "carrierId": "e277c57a-9594-4081-bc6f-4a4575eb44d4",
    "driverId": "0ddc6275-f992-4fce-a0a9-1e470d60e008",
    "vehicleId": "4a441aa9-c47b-46df-a19f-d0d69f6026a8",
    "logDate": "2025-08-15",
    "dutyEvents": [
      {
        "_id": "6e5a45e9-c411-482a-a7b0-70dc33eef205",
        "timestamp": "2025-08-15T10:49:00",
        "status": "SLEEPER_BERTH",
        "location": {
          "latitude": 31.32,
          "longitude": -94.7,
          "address": "1.61 mi E Lufkin TX"
        },
        "odometer": 466516,
        "engineHours": 11597.0,
        "source": "ELD",
        "eldRecordId": "7c85348c09a2f640"
      },
      {
        "_id": "65b6515e-a4ac-4a48-a039-f1b5f30c8f41",
        "timestamp": "2025-08-15T18:39:00",
        "status": "OFF_DUTY",
        "location": {
          "latitude": 31.32,
          "longitude": -94.7,
          "address": "1.74 mi E Lufkin TX"
        },
        "odometer": null,
        "engineHours": null,
        "source": "ELD",
        "eldRecordId": "7c85348c09a2f640"
      },
      {
        "_id": "d6a07e64-a6f9-42be-bd47-d2e8cec1c80a",
        "timestamp": "2025-08-15T19:11:00",
        "status": "ON_DUTY",
        "location": {
          "latitude": 31.32,
          "longitude": -94.7,
          "address": "1.74 mi E Lufkin TX"
        },
        "odometer": 466516,
        "engineHours": 11597.0,
        "source": "ELD",
        "eldRecordId": "7c85348c09a2f640"
      },
      {
        "_id": "51aa93b2-9ad0-4d92-a4ae-d8577d1f0cf2",
        "timestamp": "2025-08-15T19:13:00",
        "status": "OFF_DUTY",
        "location": {
          "latitude": 31.32,
          "longitude": -94.7,
          "address": "1.74 mi E Lufkin TX"
        },
        "odometer": 466516,
        "engineHours": 11597.0,
        "source": "ELD",
        "eldRecordId": "7c85348c09a2f640"
      },
      {
        "_id": "378eb981-788f-4cfb-a1a7-5d0c135bda16",
        "timestamp": "2025-08-15T19:14:00",
        "status": "DRIVING",
        "location": {
          "latitude": 31.32,
          "longitude": -94.7,
          "address": "1.74 mi E Lufkin TX"
        },
        "odometer": 466516,
        "engineHours": 11598.0,
        "source": "ELD",
        "eldRecordId": "7c85348c09a2f640"
      },
      {
        "_id": "f32854e3-8ff4-41d5-a50d-ad6373b4dbcc",
        "timestamp": "2025-08-15T19:27:00",
        "status": "OFF_DUTY",
        "location": {
          "latitude": 31.33,
          "longitude": -94.72,
          "address": "0.8 mi ENE Lufkin TX"
        },
        "odometer": 466518,
        "engineHours": 11598.0,
        "source": "ELD",
        "eldRecordId": "7c85348c09a2f640"
      },
      {
        "_id": "76723cd0-3b97-4f25-941c-2f09b41a898f",
        "timestamp": "2025-08-15T21:07:00",
        "status": "DRIVING",
        "location": {
          "latitude": 31.33,
          "longitude": -94.72,
          "address": "0.8 mi ENE Lufkin TX"
        },
        "odometer": 466519,
        "engineHours": 11599.0,
        "source": "ELD",
        "eldRecordId": "7c85348c09a2f640"
      },
      {
        "_id": "3ba54b3a-0cc9-4365-b299-9daf03955e13",
        "timestamp": "2025-08-15T22:20:00",
        "status": "OFF_DUTY",
        "location": {
          "latitude": 30.45,
          "longitude": -95.03,
          "address": "3.6 mi SSW Shepherd TX"
        },
        "odometer": 466585,
        "engineHours": 11600.0,
        "source": "ELD",
        "eldRecordId": "7c85348c09a2f640"
      },
      {
        "_id": "b8aeb285-98b3-49e7-a8f4-cfc900f8f613",
        "timestamp": "2025-08-15T22:22:00",
        "status": "ON_DUTY",
        "location": {
          "latitude": 30.45,
          "longitude": -95.03,
          "address": "3.6 mi SSW Shepherd TX"
        },
        "odometer": 466585,
        "engineHours": 11600.0,
        "source": "ELD",
        "eldRecordId": "7c85348c09a2f640"
      },
      {
        "_id": "6d6eced8-980d-40a4-ab12-aace906daf56",
        "timestamp": "2025-08-15T22:30:00",
        "status": "OFF_DUTY",
        "location": {
          "latitude": 30.45,
          "longitude": -95.03,
          "address": "3.6 mi SSW Shepherd TX"
        },
        "odometer": 466585,
        "engineHours": 11600.0,
        "source": "ELD",
        "eldRecordId": "7c85348c09a2f640"
      },
      {
        "_id": "a030fa45-016b-438b-bf5e-1c8d44192027",
        "timestamp": "2025-08-15T22:30:00",
        "status": "DRIVING",
        "location": {
          "latitude": 30.45,
          "longitude": -95.03,
          "address": "3.6 mi SSW Shepherd TX"
        },
        "odometer": 466585,
        "engineHours": 11600.0,
        "source": "ELD",
        "eldRecordId": "7c85348c09a2f640"
      }
    ],
    "status": "ACTIVE"
  },
  {
    "_id": "e124ec89-3f49-41a8-a541-ce1ba4cb646b",
    "carrierId": "e277c57a-9594-4081-bc6f-4a4575eb44d4",
    "driverId": "0ddc6275-f992-4fce-a0a9-1e470d60e008",
    "vehicleId": "4a441aa9-c47b-46df-a19f-d0d69f6026a8",
    "logDate": "2025-08-16",
    "dutyEvents": [
      {
        "_id": "76a4cb48-5e0f-4fd7-9b44-f285d85c4db4",
        "timestamp": "2025-08-16T00:14:00",
        "status": "OFF_DUTY",
        "location": {
          "latitude": 29.67,
          "longitude": -95.7,
          "address": "2.58 mi WSW Four Corners TX"
        },
        "odometer": 466676,
        "engineHours": 11602.0,
        "source": "ELD",
        "eldRecordId": "7c85348c09a2f640"
      },
      {
        "_id": "0386ff65-8205-4562-9b95-42789e8d7e4c",
        "timestamp": "2025-08-16T02:31:00",
        "status": "DRIVING",
        "location": {
          "latitude": 29.66,
          "longitude": -95.7,
          "address": "2.3 mi W Four Corners TX"
        },
        "odometer": 466676,
        "engineHours": 11603.0,
        "source": "ELD",
        "eldRecordId": "7c85348c09a2f640"
      },
      {
        "_id": "107e2956-13cd-4b7e-8e52-01d2c30901c4",
        "timestamp": "2025-08-16T02:45:00",
        "status": "OFF_DUTY",
        "location": {
          "latitude": 29.66,
          "longitude": -95.66,
          "address": "0.44 mi SSE Four Corners TX"
        },
        "odometer": 466680,
        "engineHours": 11603.0,
        "source": "ELD",
        "eldRecordId": "7c85348c09a2f640"
      }
    ],
    "status": "ACTIVE"
  }
]);

print("✅ ELD data imported successfully!");
print("Carrier: FNE TRANSPORT LLC");
print("Assets: 1");
print("Log Books: 2");
print("Total Duty Events: 14");
