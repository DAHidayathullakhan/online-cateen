const mongoose = require('mongoose');
const net = require('net');

function checkPortOpen(host, port, timeoutMs = 400) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isOpen = false;

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      isOpen = true;
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

const connectDB = async () => {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Setup event listeners once
  if (!global.__MONGO_LISTENERS_SET__) {
    global.__MONGO_LISTENERS_SET__ = true;
    mongoose.connection.on('connected', () => console.log('Mongoose event: connected'));
    mongoose.connection.on('disconnected', async () => {
      console.warn('Mongoose event: disconnected.');
      if (global.__MONGO_ACTIVE_URI__ && mongoose.connection.readyState === 0) {
        try {
          console.log('Attempting to re-establish MongoDB connection...');
          await mongoose.connect(global.__MONGO_ACTIVE_URI__);
        } catch (e) {
          console.warn('Auto-reconnect error:', e.message);
        }
      }
    });
    mongoose.connection.on('error', (err) => console.error('Mongoose event error:', err.message));
  }

  const explicitUri = process.env.MONGODB_URI;
  if (explicitUri && !explicitUri.includes('127.0.0.1:27017') && !explicitUri.includes('localhost:27017')) {
    try {
      console.log(`Connecting to explicit MongoDB at: ${explicitUri}`);
      global.__MONGO_ACTIVE_URI__ = explicitUri;
      return await mongoose.connect(explicitUri);
    } catch (err) {
      console.warn('Explicit MongoDB failed:', err.message);
    }
  }

  // Check if native MongoDB port 27017 is actively open
  const isNativeRunning = await checkPortOpen('127.0.0.1', 27017, 300);

  if (isNativeRunning) {
    try {
      const connStr = 'mongodb://127.0.0.1:27017/smart_campus_canteen';
      console.log(`Native MongoDB detected at 127.0.0.1:27017. Connecting...`);
      global.__MONGO_ACTIVE_URI__ = connStr;
      return await mongoose.connect(connStr);
    } catch (err) {
      console.warn('Native MongoDB connect error:', err.message);
    }
  } else {
    console.log('Native MongoDB on port 27017 not detected.');
  }

  mongoose.set('bufferCommands', false);

  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.log('[Database] Serverless/Production environment detected. Primary is Supabase PostgreSQL.');
    return null;
  }

  // Use persistent in-memory MongoDB
  console.log('Starting in-memory MongoMemoryServer database...');
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    if (!global.__MONGO_INSTANCE__) {
      global.__MONGO_INSTANCE__ = await MongoMemoryServer.create({
        spawn: { timeout: 60000 }
      });
    }

    const mongoUri = global.__MONGO_INSTANCE__.getUri();
    global.__MONGO_ACTIVE_URI__ = mongoUri;
    console.log(`In-memory MongoDB active at: ${mongoUri}`);

    const conn = await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully via MongoMemoryServer.');
    return conn;
  } catch (fallbackErr) {
    console.error('Failed to connect to in-memory MongoDB:', fallbackErr.message);
    return null;
  }
};

module.exports = connectDB;
