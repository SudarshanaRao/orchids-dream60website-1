// src/config/db.js
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

/**
 * ✅ Enhanced MongoDB connection with retry logic and better error handling
 */
const connectDB = async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dream60';
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 5000; // 5 seconds
    
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
        try {
            // Configure mongoose settings
            mongoose.set('strictQuery', false);
            
            const conn = await mongoose.connect(MONGO_URI, {
                serverSelectionTimeoutMS: 10000, // 10 seconds timeout for server selection
                socketTimeoutMS: 45000, // 45 seconds timeout for socket operations
                family: 4, // Use IPv4, skip trying IPv6
                maxPoolSize: 10, // Maximum number of socket connections
                minPoolSize: 2, // Minimum number of socket connections
                retryWrites: true,
                retryReads: true,
            });

            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
            console.log(`✅ MongoDB Database: ${conn.connection.name}`);
            console.log(`✅ MongoDB Connection State: ${conn.connection.readyState}`);
            
            // Setup connection event listeners
            setupConnectionListeners();
            
            return conn;
        } catch (err) {
            retries++;
            console.error(`❌ MongoDB connection attempt ${retries}/${MAX_RETRIES} failed:`, err.message);
            
            if (retries < MAX_RETRIES) {
                console.log(`🔄 Retrying MongoDB connection in ${RETRY_DELAY/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                console.error('❌ Max MongoDB connection retries reached. Exiting...');
                process.exit(1);
            }
        }
    }
};

/**
 * Setup MongoDB connection event listeners for monitoring
 */
const setupConnectionListeners = () => {
    mongoose.connection.on('connected', () => {
        console.log('✅ Mongoose connected to MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
        console.error('❌ Mongoose connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
        console.log('⚠️ Mongoose disconnected from MongoDB');
    });
    
    mongoose.connection.on('reconnected', () => {
        console.log('✅ Mongoose reconnected to MongoDB');
    });
    
    // Handle app termination
    process.on('SIGINT', async () => {
        try {
            await mongoose.connection.close();
            console.log('✅ Mongoose connection closed through app termination');
            process.exit(0);
        } catch (err) {
            console.error('❌ Error closing Mongoose connection:', err);
            process.exit(1);
        }
    });
};

/**
 * Check if MongoDB is connected
 */
const isConnected = () => {
    return mongoose.connection.readyState === 1;
};

/**
 * Wait for MongoDB connection to be ready
 * @param {Number} timeout - Maximum time to wait in milliseconds (default: 30000ms)
 * @returns {Promise<Boolean>} - True if connected, false if timeout
 */
const waitForConnection = async (timeout = 30000) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        if (isConnected()) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
};

module.exports = { 
    connectDB, 
    isConnected, 
    waitForConnection 
};