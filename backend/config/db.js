const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/smart_campus_canteen';
  try {
    // Attempt standard connection with 3 sec timeout to fail quickly if local mongod is down
    console.log(`Connecting to MongoDB at: ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('MongoDB connected successfully via native URI.');
  } catch (err) {
    console.warn('Native MongoDB connection failed or timed out:', err.message);
    console.log('Attempting in-memory fallback via mongodb-memory-server...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      console.log(`In-memory MongoDB started at: ${mongoUri}`);
      await mongoose.connect(mongoUri);
      console.log('MongoDB connected successfully via MongoMemoryServer fallback.');
    } catch (memErr) {
      console.error('Fatal Database Error: Failed to connect to MongoDB and Memory Server fallback.', memErr);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
