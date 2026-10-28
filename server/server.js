import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabase } from './services/seedService.js';
import { initCronScheduler } from './services/cronService.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Establish database connection (Atlas or local in-memory fallback)
    await connectDB();

    // 2. Automatically seed initial catalogue, admin, demo accounts and templates
    await seedDatabase();

    // 3. Register daily cron schedule for Section 187 default bail deadline alerts
    initCronScheduler();

    // 4. Start listening for incoming connections
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  Bail Reckoner API Server running on port ${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  BNSS 2023 & BNS 2023 Legal Engine Active`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Fatal error during server startup:', error);
    process.exit(1);
  }
};

startServer();
