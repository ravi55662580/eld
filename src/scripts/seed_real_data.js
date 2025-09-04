const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import models
const Carrier = require('../models/Carrier');
const Driver = require('../models/Driver');
const Asset = require('../models/Asset');
const LogBook = require('../models/LogBook');
const User = require('../models/User');

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Connect to MongoDB directly for seeding
const mongoUri = process.env.MONGODB_URI || 'mongodb://root:password123@localhost:27017/eld-software?authSource=admin';
const directUri = mongoUri; // Use the auth connection

// Helper function to convert duty status to event code
function getEventCode(status) {
  const statusMap = {
    'OFF_DUTY': '1',
    'SLEEPER_BERTH': '2', 
    'DRIVING': '3',
    'ON_DUTY': '4',
    'PERSONAL_CONVEYANCE': '5',
    'YARD_MOVE': '6'
  };
  return statusMap[status] || '1'; // Default to OFF_DUTY
}

async function seedRealELDData() {
  try {
    console.log('🚀 Starting ELD Real Data Seeding Process...');
    
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(directUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB successfully');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      Carrier.deleteMany({}),
      Driver.deleteMany({}),
      Asset.deleteMany({}),
      LogBook.deleteMany({}),
      User.deleteMany({ role: { $ne: 'admin' } }) // Keep admin users
    ]);
    
    // Load the parsed ELD data
    const dataPath = path.join(__dirname, '../../../eld_seed_data.json');
    const eldData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('📊 Loaded ELD data from FNE TRANSPORT LLC');
    console.log(`   - Date Range: ${eldData.metadata.dateRange.start} to ${eldData.metadata.dateRange.end}`);
    console.log(`   - Total Original Records: ${eldData.metadata.totalRecords}`);
    
    // 1. Create Carrier
    console.log('🏢 Creating carrier: FNE TRANSPORT LLC...');
    const carrier = new Carrier({
      name: eldData.carrier.name,
      dotNumber: eldData.carrier.dotNumber,
      mcNumber: eldData.carrier.mcNumber || 'MC-000000',
      address: {
        street: '1234 Transport Way',
        city: 'Houston',
        state: eldData.carrier.address.state,
        zipCode: '77001',
        country: eldData.carrier.address.country
      },
      phone: '+17135550123',
      email: 'dispatch@fnetransport.com',
      website: 'https://www.fnetransport.com',
      isActive: eldData.carrier.isActive,
      timezone: 'America/Chicago'
    });
    
    const savedCarrier = await carrier.save();
    console.log(`✅ Carrier created with ID: ${savedCarrier._id}`);
    
    // 2. Create Admin User for the carrier
    console.log('👤 Creating carrier admin user...');
    const adminUser = new User({
      username: 'fne_admin',
      email: 'admin@fnetransport.com',
      password: 'Admin123!', // Will be hashed by pre-save middleware
      firstName: 'Fleet',
      lastName: 'Manager',
      role: 'manager',
      carrierId: savedCarrier._id,
      isActive: true,
      permissions: {
        canManageDrivers: true,
        canManageVehicles: true,
        canViewReports: true,
        canManageUsers: false
      }
    });
    
    const savedAdminUser = await adminUser.save();
    console.log(`✅ Admin user created: ${savedAdminUser.username}`);
    
    // 3. Create Driver
    console.log('🚛 Creating driver...');
    const driverData = eldData.drivers[0];
    const driver = new Driver({
      carrierId: savedCarrier._id,
      firstName: driverData.firstName,
      lastName: driverData.lastName,
      username: driverData.eldUsername,
      licenseNumber: driverData.licenseNumber,
      licenseState: driverData.licenseState || 'TX',
      homeBase: 'Houston Terminal',
      active: true,
      dvirAccess: 'DVIR',
      units: 'Miles/Gallons',
      registrationState: 'TX',
      settings: {
        personalUse: true,
        yardMove: true,
        exemption: false,
        dvirWifiOnly: false,
        allowExemption: false,
        allowDvirPhoto: true
      }
    });
    
    const savedDriver = await driver.save();
    console.log(`✅ Driver created: ${savedDriver.firstName} ${savedDriver.lastName} (${savedDriver.licenseNumber})`);
    
    // 4. Create Driver User Account
    console.log('👤 Creating driver user account...');
    const driverUser = new User({
      username: driverData.eldUsername,
      email: 'john.driver@fnetransport.com',
      password: 'Driver123!', // Will be hashed by pre-save middleware
      firstName: driverData.firstName,
      lastName: driverData.lastName,
      role: 'driver',
      carrierId: savedCarrier._id,
      driverId: savedDriver._id,
      isActive: true,
      permissions: {
        canManageDrivers: false,
        canManageVehicles: false,
        canViewReports: false,
        canManageUsers: false
      }
    });
    
    const savedDriverUser = await driverUser.save();
    console.log(`✅ Driver user account created: ${savedDriverUser.username}`);
    
    // 5. Create Assets (Vehicles)
    console.log('🚐 Creating vehicles...');
    const savedAssets = [];
    
    for (const assetData of eldData.assets) {
      const asset = new Asset({
        carrierId: savedCarrier._id,
        type: 'Tractor', // Valid enum value
        assetSubtype: 'Semi',
        number: assetData.vehicleNumber,
        vin: assetData.vin,
        fuelType: 'Diesel',
        plate: `TX${assetData.vehicleNumber}ABC`,
        registrationState: 'TX',
        homeBase: 'Home Terminal',
        description: `${assetData.make} ${assetData.model} Tractor`,
        active: true,
        make: assetData.make,
        model: assetData.model,
        year: assetData.year,
        color: 'White',
        mileage: 0,
        registrationExpiryDate: new Date('2026-01-31'),
        maintenanceSchedule: [{
          type: 'Oil Change',
          dueDate: new Date('2025-03-01'),
          dueMileage: 500000,
          completed: false,
          notes: 'Regular maintenance scheduled'
        }]
      });
      
      const savedAsset = await asset.save();
      savedAssets.push(savedAsset);
      console.log(`✅ Vehicle created: ${savedAsset.make} ${savedAsset.model} #${savedAsset.number}`);
    }
    
    // 6. Create Log Books with Duty Events
    console.log('📋 Creating log books with duty events...');
    const savedLogBooks = [];
    
    for (const logBookData of eldData.logBooks) {
      const logBook = new LogBook({
        carrierId: savedCarrier._id,
        driverId: savedDriver._id,
        date: new Date(logBookData.logDate),
        primaryVehicle: savedAssets.find(a => a.number === '929')?._id,
        events: (logBookData.dutyEvents || []).map(event => ({
          eventType: event.status,
          eventCode: getEventCode(event.status),
          startTime: new Date(event.timestamp),
          location: {
            latitude: event.location.latitude,
            longitude: event.location.longitude,
            address: event.location.address
          },
          odometer: event.odometer,
          engineHours: event.engineHours,
          vehicleId: savedAssets.find(a => a.number === '929')?._id
        })),
        totalMiles: 0,
        isCertified: false
      });
      
      // Calculate total miles from odometer readings
      const odometerReadings = (logBookData.dutyEvents || [])
        .filter(e => e.odometer)
        .map(e => e.odometer)
        .sort((a, b) => a - b);
      
      if (odometerReadings.length > 1) {
        logBook.totalMiles = odometerReadings[odometerReadings.length - 1] - odometerReadings[0];
      }
      
      const savedLogBook = await logBook.save();
      savedLogBooks.push(savedLogBook);
      console.log(`✅ Log book created for ${savedLogBook.date.toDateString()} with ${savedLogBook.events.length} duty events`);
    }
    
    // 7. Generate Summary
    console.log('📊 Data Seeding Summary:');
    console.log(`   ✅ Carrier: ${savedCarrier.name} (DOT: ${savedCarrier.dotNumber})`);
    console.log(`   ✅ Users: 2 (1 manager, 1 driver)`);
    console.log(`   ✅ Drivers: ${eldData.drivers.length}`);
    console.log(`   ✅ Assets: ${savedAssets.length}`);
    console.log(`   ✅ Log Books: ${savedLogBooks.length}`);
    console.log(`   ✅ Total Duty Events: ${savedLogBooks.reduce((sum, lb) => sum + lb.events.length, 0)}`);
    console.log(`   ✅ Date Range: ${eldData.metadata.dateRange.start} to ${eldData.metadata.dateRange.end}`);
    
    // 8. Login Information
    console.log('\n🔐 Login Credentials:');
    console.log('   Manager Account:');
    console.log(`     Username: ${savedAdminUser.username}`);
    console.log(`     Password: Admin123!`);
    console.log(`     Email: ${savedAdminUser.email}`);
    console.log('   ');
    console.log('   Driver Account:');
    console.log(`     Username: ${savedDriverUser.username}`);
    console.log(`     Password: Driver123!`);
    console.log(`     Email: ${savedDriverUser.email}`);
    
    console.log('\n🎉 ELD Real Data Seeding completed successfully!');
    
    return {
      carrier: savedCarrier,
      users: [savedAdminUser, savedDriverUser],
      drivers: [savedDriver],
      assets: savedAssets,
      logBooks: savedLogBooks
    };
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedRealELDData()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedRealELDData;
