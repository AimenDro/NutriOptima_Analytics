const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrioptima';
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    isConnected = false;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error(`
⚠️  IP WHITELIST ISSUE DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your IP address is not whitelisted in MongoDB Atlas.

QUICK FIX:
1. Go to: https://cloud.mongodb.com/
2. Select your cluster: NutriOptima
3. Click "Network Access" in the left sidebar
4. Click "Add IP Address"
5. Click "Allow Access from Anywhere" (0.0.0.0/0) for development
6. Click "Confirm"
7. Wait 1-2 minutes for changes to apply
8. Restart this server

ALTERNATIVE - Use Local MongoDB:
Set MONGODB_URI=mongodb://localhost:27017/nutrioptima in .env file
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    }
    
    // Don't exit process - allow server to run without DB for testing
    console.warn('⚠️  Server will continue without database connection');
    console.warn('⚠️  Auth and data features will not work until DB is connected');
  }
};

// Check if MongoDB is connected
const isDBConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

module.exports = connectDB;
module.exports.isDBConnected = isDBConnected;
