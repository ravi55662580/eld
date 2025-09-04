require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const apiPrefix = '/api/v1';

// Health check
app.get('/health', (req, res) => {
  console.log('Health check accessed');
  res.json({
    success: true,
    message: 'ELD Software API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mock carriers data
app.get(`${apiPrefix}/carriers`, (req, res) => {
  console.log('Carriers endpoint accessed');
  
  // Mock carrier data that matches the frontend expectations
  const mockCarriers = [
    {
      _id: "507f1f77bcf86cd799439011",
      name: "FNE TRANSPORT LLC",
      dotNumber: "3456789",
      mcNumber: "MC-123456",
      address: {
        street: "123 Transport Way",
        city: "Chicago",
        state: "IL",
        zipCode: "60601",
        country: "USA"
      },
      phone: "(555) 123-4567",
      email: "dispatch@fnetransport.com",
      website: "https://fnetransport.com",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: { 
      carriers: mockCarriers,
      total: mockCarriers.length
    }
  });
});

// Mock drivers endpoint
app.get(`${apiPrefix}/drivers`, (req, res) => {
  console.log('Drivers endpoint accessed');
  
  const mockDrivers = [
    {
      _id: "507f1f77bcf86cd799439013",
      firstName: "John",
      lastName: "Smith",
      licenseNumber: "D123456789",
      licenseState: "IL",
      employeeId: "EMP001",
      phone: "(555) 987-6543",
      email: "john.smith@fnetransport.com",
      carrierId: "507f1f77bcf86cd799439011",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: "507f1f77bcf86cd799439014",
      firstName: "Demo",
      lastName: "Driver",
      licenseNumber: "D987654321",
      licenseState: "IL", 
      employeeId: "EMP002",
      phone: "(555) 123-9876",
      email: "demo@fnetransport.com",
      carrierId: "507f1f77bcf86cd799439011",
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: {
      drivers: mockDrivers,
      total: mockDrivers.length
    }
  });
});

// Mock logbooks endpoint
app.get(`${apiPrefix}/logbooks`, (req, res) => {
  console.log('Logbooks endpoint accessed');
  res.json({
    success: true,
    data: {
      logBooks: [
        {
          _id: "507f1f77bcf86cd799439012",
          date: new Date().toISOString().split('T')[0],
          driverId: {
            _id: "507f1f77bcf86cd799439013",
            firstName: "John",
            lastName: "Smith"
          },
          primaryVehicle: {
            _id: "507f1f77bcf86cd799439015",
            number: "TRUCK-001",
            make: "Freightliner",
            model: "Cascadia"
          },
          carrierId: {
            _id: "507f1f77bcf86cd799439011",
            name: "FNE TRANSPORT LLC",
            dotNumber: "3456789"
          },
          status: "Active",
          dutyEvents: [
            {
              time: "08:00",
              status: "ON_DUTY",
              location: "Chicago, IL"
            },
            {
              time: "09:00",
              status: "DRIVING",
              location: "Chicago, IL"
            }
          ]
        }
      ],
      total: 1
    }
  });
});

// Mock vehicles endpoint
app.get(`${apiPrefix}/assets`, (req, res) => {
  console.log('Assets endpoint accessed');
  res.json({
    success: true,
    data: {
      assets: [
        {
          _id: "507f1f77bcf86cd799439015",
          type: "vehicle",
          number: "TRUCK-001",
          make: "Freightliner",
          model: "Cascadia",
          year: 2022,
          vin: "1FUJGBDV8NLBC1234",
          licensePlate: "IL-TRK-001",
          carrierId: "507f1f77bcf86cd799439011",
          isActive: true
        },
        {
          _id: "507f1f77bcf86cd799439016",
          type: "trailer",
          number: "TRAILER-001",
          make: "Wabash",
          model: "DuraPlate",
          year: 2021,
          vin: "1JJV532W5LL123456",
          licensePlate: "IL-TRL-001",
          carrierId: "507f1f77bcf86cd799439011",
          isActive: true
        }
      ],
      total: 2
    }
  });
});

// Mock violations endpoint
app.get(`${apiPrefix}/violations`, (req, res) => {
  console.log('Violations endpoint accessed');
  res.json({
    success: true,
    data: {
      violations: [
        {
          _id: "507f1f77bcf86cd799439017",
          driverId: "507f1f77bcf86cd799439013",
          driver: {
            firstName: "John",
            lastName: "Smith"
          },
          type: "HOS_VIOLATION",
          description: "Driving beyond 11-hour limit",
          severity: "HIGH",
          date: new Date().toISOString().split('T')[0],
          status: "OPEN",
          carrierId: "507f1f77bcf86cd799439011"
        }
      ],
      total: 1
    }
  });
});

// Mock DVIR endpoint
app.get(`${apiPrefix}/dvirs`, (req, res) => {
  console.log('DVIR endpoint accessed');
  res.json({
    success: true,
    data: {
      dvirs: [
        {
          _id: "507f1f77bcf86cd799439018",
          driverId: "507f1f77bcf86cd799439013",
          driver: {
            firstName: "John",
            lastName: "Smith"
          },
          vehicleId: "507f1f77bcf86cd799439015",
          vehicle: {
            number: "TRUCK-001",
            make: "Freightliner",
            model: "Cascadia"
          },
          type: "PRE_TRIP",
          date: new Date().toISOString().split('T')[0],
          status: "COMPLETED",
          defectsFound: false,
          carrierId: "507f1f77bcf86cd799439011"
        }
      ],
      total: 1
    }
  });
});

// Mock fuel receipts endpoint
app.get(`${apiPrefix}/fuel-receipts`, (req, res) => {
  console.log('Fuel receipts endpoint accessed');
  res.json({
    success: true,
    data: {
      fuelReceipts: [
        {
          _id: "507f1f77bcf86cd799439019",
          driverId: "507f1f77bcf86cd799439013",
          driver: {
            firstName: "John",
            lastName: "Smith"
          },
          vehicleId: "507f1f77bcf86cd799439015",
          vehicle: {
            number: "TRUCK-001"
          },
          date: new Date().toISOString().split('T')[0],
          gallons: 85.4,
          pricePerGallon: 3.85,
          totalAmount: 328.79,
          location: "Chicago, IL",
          carrierId: "507f1f77bcf86cd799439011"
        }
      ],
      total: 1
    }
  });
});

// Mock notifications endpoint
app.get(`${apiPrefix}/notifications`, (req, res) => {
  console.log('Notifications endpoint accessed');
  res.json({
    success: true,
    data: {
      notifications: [
        {
          _id: "507f1f77bcf86cd799439020",
          title: "HOS Violation Alert",
          message: "Driver John Smith approaching 11-hour limit",
          type: "WARNING",
          priority: "HIGH",
          createdAt: new Date().toISOString(),
          read: false,
          carrierId: "507f1f77bcf86cd799439011"
        }
      ],
      total: 1
    }
  });
});

// Mock state mileage endpoint
app.get(`${apiPrefix}/state-mileage`, (req, res) => {
  console.log('State mileage endpoint accessed');
  res.json({
    success: true,
    data: {
      stateMileage: [
        {
          _id: "507f1f77bcf86cd799439021",
          state: "IL",
          miles: 1250.5,
          fuelGallons: 425.2,
          quarter: "Q1",
          year: 2025,
          carrierId: "507f1f77bcf86cd799439011"
        },
        {
          _id: "507f1f77bcf86cd799439022",
          state: "IN",
          miles: 890.3,
          fuelGallons: 302.1,
          quarter: "Q1",
          year: 2025,
          carrierId: "507f1f77bcf86cd799439011"
        }
      ],
      total: 2
    }
  });
});


const PORT = process.env.PORT || 3002;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple ELD Server running on http://localhost:${PORT}`);
  console.log(`📋 Carriers: http://localhost:${PORT}${apiPrefix}/carriers`);
  console.log(`📚 Logbooks: http://localhost:${PORT}${apiPrefix}/logbooks`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
});
