#!/usr/bin/env node

import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`
🚛 ELD SOFTWARE - REAL DATA SETUP
==================================

This script will populate your ELD backend with real data from:
📊 FNE TRANSPORT LLC (DOT: 4345433)
📅 Date Range: August 15-16, 2025
🚛 1 Driver, 1 Tractor, 2 Log Books, 14 Duty Events

`);

async function setupRealData() {
  try {
    console.log('🚀 Starting setup process...\n');
    
    // Change to backend directory
    const backendDir = path.join(__dirname, 'eld-backend');
    console.log(`📁 Working directory: ${backendDir}`);
    
    // Run the seeding script
    console.log('🌱 Running database seeding...\n');
    
    const seedProcess = spawn('node', ['src/scripts/seed_real_data.js'], {
      cwd: backendDir,
      stdio: 'inherit'
    });
    
    seedProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`
✅ SETUP COMPLETED SUCCESSFULLY!

🔐 Login Credentials:
   Manager Account:
     Username: fne_admin
     Password: Admin123!
     Email: admin@fnetransport.com
   
   Driver Account:
     Username: jdriver
     Password: Driver123!
     Email: john.driver@fnetransport.com

🚀 Next Steps:
   1. Start your backend server:
      cd eld-backend && npm run dev
   
   2. Start your frontend:
      npm run dev
   
   3. Visit: http://localhost:5173
   
   4. Login with either account to see real ELD data!

📊 Available API Endpoints:
   • POST /api/v1/auth/login
   • GET  /api/v1/logbooks
   • GET  /api/v1/dvirs
   • GET  /api/v1/fuel-receipts
   • GET  /api/v1/violations
   • GET  /api/v1/state-mileage
   • GET  /api/v1/compliance
   • GET  /api/v1/reports
   • And many more...

🎉 Your ELD system is now ready with real trucking data!
`);
      } else {
        console.error(`❌ Setup failed with code ${code}`);
        console.log(`
🔧 Troubleshooting:
   1. Make sure MongoDB is running
   2. Check your .env file in eld-backend/
   3. Ensure all dependencies are installed:
      cd eld-backend && npm install
`);
      }
    });
    
    seedProcess.on('error', (error) => {
      console.error('❌ Error running setup:', error.message);
      console.log(`
🔧 Troubleshooting:
   1. Make sure you're in the correct directory
   2. Ensure Node.js is installed
   3. Check that eld-backend directory exists
`);
    });
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
  }
}

// Run setup
setupRealData();
