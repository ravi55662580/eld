require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Carrier = require('../models/Carrier');
const Driver = require('../models/Driver');
const Asset = require('../models/Asset');
const Notification = require('../models/Notification');

const seedData = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Carrier.deleteMany({});
    await Driver.deleteMany({});
    await Asset.deleteMany({});
    await Notification.deleteMany({});

    // Create Carrier
    console.log('🏢 Creating carrier...');
    const carrier = await Carrier.create({
      name: 'limitlessworld.demo',
      dotNumber: '7894567',
      mcNumber: 'MC-123456',
      address: {
        street: '123 Main Street',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210'
      },
      phone: '5551234567',
      email: 'contact@limitlessworld.com',
      website: 'https://limitlessworld.demo',
      timezone: 'America/Los_Angeles',
      settings: {
        maxDrivers: 100,
        maxAssets: 50,
        allowPersonalUse: true,
        requireDVIR: true,
        hosRuleset: '70-hour/8-day'
      }
    });

    // Create Admin User
    console.log('👨‍💼 Creating admin user...');
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@limitlessworld.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    // Create Manager User
    console.log('👩‍💼 Creating manager user...');
    const managerUser = await User.create({
      username: 'manager',
      email: 'manager@limitlessworld.com',
      password: 'manager123',
      firstName: 'Manager',
      lastName: 'User',
      role: 'manager',
      carrierId: carrier._id
    });

    // Create Demo Account User
    console.log('👤 Creating demo account...');
    const demoUser = await User.create({
      username: 'demoaccount',
      email: 'demo@limitlessworld.com',
      password: 'demo123',
      firstName: 'Demo',
      lastName: 'Account',
      role: 'manager',
      carrierId: carrier._id
    });

    // Create Drivers
    console.log('🚛 Creating drivers...');
    const drivers = await Driver.create([
      {
        carrierId: carrier._id,
        firstName: 'Demo',
        lastName: 'Driver',
        username: 'DemoD123',
        licenseNumber: '123456789123',
        licenseState: 'CA',
        homeBase: 'Home Terminal',
        active: true,
        settings: {
          personalUse: true,
          yardMove: true,
          exemption: false,
          dvirWifiOnly: false,
          allowExemption: false,
          allowDvirPhoto: true
        }
      },
      {
        carrierId: carrier._id,
        firstName: 'Demo',
        lastName: 'Driver',
        username: 'DD001',
        licenseNumber: '85256665',
        licenseState: 'CA',
        homeBase: 'Home Terminal',
        active: true,
        settings: {
          personalUse: true,
          yardMove: true,
          exemption: false,
          dvirWifiOnly: false,
          allowExemption: false,
          allowDvirPhoto: true
        }
      }
    ]);

    // Create Assets
    console.log('🚚 Creating assets...');
    const assets = await Asset.create([
      {
        carrierId: carrier._id,
        type: 'Tractor',
        assetSubtype: 'Truck',
        number: '001',
        vin: '1GRAP0628DJ480001',
        fuelType: 'Diesel',
        plate: '',
        registrationState: 'CA',
        homeBase: 'Home Terminal',
        active: true,
        make: 'Freightliner',
        model: 'Cascadia',
        year: 2020,
        color: 'White',
        mileage: 125000
      },
      {
        carrierId: carrier._id,
        type: 'Tractor',
        assetSubtype: 'Truck',
        number: '123',
        vin: '1234567891234AWEH',
        fuelType: 'Diesel',
        plate: '41GB2392',
        registrationState: 'CA',
        homeBase: 'Home Terminal',
        active: true,
        make: 'Peterbilt',
        model: '579',
        year: 2019,
        color: 'Red',
        mileage: 89000
      }
    ]);

    // Create Sample Notification
    console.log('📧 Creating sample notification...');
    const notification = await Notification.create({
      carrierId: carrier._id,
      name: 'HOS Violation Alert',
      type: 'HOS_VIOLATION',
      homeBase: 'All',
      emails: ['alert@limitlessworld.com', 'manager@limitlessworld.com'],
      conditions: {
        severity: 'high',
        frequency: 'immediate'
      },
      template: {
        subject: 'HOS Violation Detected - {{driverName}}',
        body: 'Driver {{driverName}} has exceeded their allowed driving hours. Immediate action required.'
      },
      isActive: true,
      createdBy: adminUser._id
    });

    console.log('✅ Seed data created successfully!');
    console.log(`
📊 CREATED DATA SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏢 Carrier: ${carrier.name} (DOT: ${carrier.dotNumber})
👥 Users: 3 (1 admin, 1 manager, 1 demo)
🚛 Drivers: ${drivers.length}
🚚 Assets: ${assets.length}
📧 Notifications: 1

🔑 LOGIN CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Admin:
  Username: admin
  Password: admin123

Manager:  
  Username: manager
  Password: manager123

Demo Account:
  Username: demoaccount  
  Password: demo123

🚀 Ready to connect your frontend!
    `);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

// Run the seed function
seedData();
