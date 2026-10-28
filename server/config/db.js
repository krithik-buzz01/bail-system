import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '' && uri !== 'memory') {
    try {
      console.log('Connecting to MongoDB Atlas / configured URI...');
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`Connected to MongoDB Atlas: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`Could not connect to external MongoDB URI (${err.message}). Falling back to MongoMemoryServer...`);
    }
  }

  // Fallback to in-memory MongoDB for seamless development and testing
  try {
    console.log('Starting in-memory MongoDB (MongoMemoryServer)...');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`Connected to In-Memory MongoDB: ${memoryUri}`);
    return conn;
  } catch (memErr) {
    console.error('Failed to start in-memory MongoDB:', memErr);
    throw memErr;
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
