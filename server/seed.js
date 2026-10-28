import dotenv from 'dotenv';
dotenv.config();

import { connectDB, closeDB } from './config/db.js';
import { seedDatabase } from './services/seedService.js';

const run = async () => {
  try {
    await connectDB();
    await seedDatabase();
    console.log('Seed process completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed process failed:', error);
    process.exit(1);
  }
};

run();
