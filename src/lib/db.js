import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer = null;
let isConnected = false;
let cachedUri = null;

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    let uri = MONGODB_URI;

    if (!uri) {
      if (!mongoServer) {
        mongoServer = await MongoMemoryServer.create();
      }
      uri = mongoServer.getUri();
    }

    // If we already have a connection to the same URI, just reuse it
    if (cachedUri === uri && mongoose.connection.readyState === 1) {
      isConnected = true;
      return mongoose.connection;
    }

    // If there's an existing connection, disconnect first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      isConnected = false;
    }

    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedUri = uri;
    isConnected = true;
    console.log('MongoDB connected:', conn.connection.host);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDB() {
  if (mongoServer) {
    await mongoose.disconnect();
    await mongoServer.stop();
    mongoServer = null;
    cachedUri = null;
    isConnected = false;
  }
}

export default connectDB;
