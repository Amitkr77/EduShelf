import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer = null;
let connectionPromise = null;

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDB() {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If a connection is already in progress, wait for it
  // This prevents the race condition where multiple requests
  // try to connect/disconnect simultaneously
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = _connect();

  try {
    const conn = await connectionPromise;
    return conn;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
}

async function _connect() {
  try {
    let uri = MONGODB_URI;

    // Fallback to in-memory MongoDB for development
    if (!uri) {
      if (!mongoServer) {
        mongoServer = await MongoMemoryServer.create();
      }
      uri = mongoServer.getUri();
    }

    // Only connect if not already connected or connecting
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (mongoose.connection.readyState === 2) {
      // Already connecting — wait for it
      await new Promise((resolve) => {
        mongoose.connection.once('open', resolve);
      });
      return mongoose.connection;
    }

    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    console.log('MongoDB connected:', conn.connection.host);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  } finally {
    connectionPromise = null;
  }
}

export async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
    connectionPromise = null;
  } catch (error) {
    console.error('MongoDB disconnect error:', error);
  }
}

export default connectDB;