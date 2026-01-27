// server.js 
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { initializeScheduler, stopScheduler } = require('./src/config/scheduler');
const { connectDB, isConnected } = require('./src/config/db');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const priceMartRoutes = require('./src/routes/priceMartRoutes');
const schedulerRoutes = require('./src/routes/schedulerRoutes');
const razorpayRoutes = require('./src/routes/razorpayRoutes');
const utilityRoutes = require('./src/routes/utilityRoutes');
const userHistoryRoutes = require('./src/routes/userHistory');
const prizeClaimRoutes = require('./src/routes/prizeClaim');
const emailRoutes = require('./src/routes/emailRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const pushNotificationRoutes = require('./src/routes/pushNotificationRoutes');
const supportChatRoutes = require('./src/routes/supportChat');
const careersRoutes = require('./src/routes/careersRoutes');
const feedbackRoutes = require('./src/routes/feedbackRoutes');
const userActivityRoutes = require('./src/routes/userActivityRoutes');

const app = express();

// --------------------
// Middleware
// --------------------
app.use(express.json());

// Dynamic CORS setup (supports comma-separated env, and common local-network IPs in dev)
const raw = process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:5173';
let allowedOrigins = Array.isArray(raw) ? raw : String(raw).split(',').map(s => s.trim()).filter(Boolean);

// Normalize entries (remove trailing slash)
allowedOrigins = allowedOrigins.map(u => u.replace(/\/$/, ''));

// ✅ ADD: Support for production domains
const productionDomains = [
  'https://www.dream60.com',
  'https://dream60.com',
  'http://www.dream60.com',
  'http://dream60.com',
  'https://test.dream60.com',
  'http://test.dream60.com',
  'https://form.dream60.com',
  'http://form.dream60.com',
  'https://dream60website-1.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

// Merge production domains with allowed origins (avoid duplicates)
allowedOrigins = [...new Set([...allowedOrigins, ...productionDomains])];

const isLocalNetwork = (hostname) => {
  return hostname === 'localhost' ||
         hostname === '127.0.0.1' ||
         hostname.startsWith('192.168.') ||
         hostname.startsWith('10.') ||
         hostname.startsWith('172.16.') || hostname.startsWith('172.17.') || hostname.startsWith('172.18.') || hostname.startsWith('172.19.') ||
         hostname.startsWith('172.2') // covers 172.20 - 172.31 roughly
};

const isOrchidsPage = (hostname) => {
  return hostname.endsWith('.orchids.page');
};

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (curl, Postman, mobile native, same-origin)
      if (!origin) return callback(null, true);

      try {
        // Normalize the incoming origin
        const parsed = new URL(origin);
        const incomingOrigin = parsed.origin.replace(/\/$/, '');
        const hostname = parsed.hostname;

        // 1) Exact match with configured allowedOrigins
        if (allowedOrigins.includes(incomingOrigin)) {
          return callback(null, true);
        }

        // 2) Allow all *.orchids.page domains (dynamic Orchids URLs)
        if (isOrchidsPage(hostname)) {
          return callback(null, true);
        }

        // 3) In non-production, allow typical local-network IPs and localhost
        if (process.env.NODE_ENV !== 'production' && isLocalNetwork(hostname)) {
          return callback(null, true);
        }

        // 4) Always allow localhost in dev
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return callback(null, true);
        }

        // Reject if not allowed
        console.error(`❌ Not allowed by CORS: ${incomingOrigin}`);
        return callback(null, false);
      } catch (e) {
        return callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Explicit OPTIONS handler for all routes
app.options(/(.*)/, cors());
console.log(`🌍 Allowed frontend origins: ${allowedOrigins.join(', ')}`);
console.log(`🌍 Allowing all *.orchids.page domains`);
console.log(`🌍 NODE_ENV=${process.env.NODE_ENV || 'undefined'}`);

// --------------------
// Swagger Setup
// --------------------
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dream60 API',
      version: '1.0.0',
      description:
        'Comprehensive API documentation for Dream60 Auction Game backend.',
      contact: {
        name: 'Finpages Tech Pvt Ltd',
        url: 'https://finpages.in',
        email: 'support@finpages.in',
      },
    },
    servers: [
      {
        url:
          process.env.API_BASE_URL ||
          `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development Server',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/routes/v2/*.js'], // Read all route files including v2
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/d60-internal-ref', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

console.log(
  `📘 Swagger Docs available at: ${
    process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`
  }/d60-internal-ref`
);

// --------------------
// Routes (No /v1 prefixes)
// --------------------
app.use('/auth', authRoutes);
app.use('/auth', userRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/emails', emailRoutes);
app.use('/priceMart', priceMartRoutes);
app.use('/scheduler', schedulerRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/utility', utilityRoutes);
app.use('/user', userHistoryRoutes);
app.use('/prize-claim', prizeClaimRoutes);
app.use('/contact', contactRoutes);
app.use('/push-notification', pushNotificationRoutes);
app.use('/support-chat', supportChatRoutes);
app.use('/careers', careersRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/user-activity', userActivityRoutes);

// --------------------
// MongoDB Connection
// --------------------
let schedulerJobs = null;

connectDB()
  .then(() => {
    console.log(`✅ MongoDB connected successfully`);
    
    // ✅ Wait a moment for connection to stabilize before initializing scheduler
    setTimeout(() => {
      if (isConnected()) {
        schedulerJobs = initializeScheduler();
        console.log('✅ Scheduler initialized successfully');
      } else {
        console.error('⚠️ MongoDB not connected, scheduler initialization delayed');
      }
    }, 2000);
    
    // Graceful shutdown handler with Promise-based mongoose close
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT signal. Shutting down gracefully...');
      if (schedulerJobs) {
        stopScheduler(schedulerJobs);
      }
      try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM signal. Shutting down gracefully...');
      if (schedulerJobs) {
        stopScheduler(schedulerJobs);
      }
      try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('❌ Application will continue but database operations will fail');
    // Don't exit - let the app run and retry connection logic will handle it
  });

// --------------------
// Root Endpoint
// --------------------
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Dream60 Backend API 🚀',
    environment: process.env.NODE_ENV || 'development',
    database: isConnected() ? 'Connected' : 'Disconnected',
  });
});

// --------------------
// Health Check Endpoint
// --------------------
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? 'healthy' : 'unhealthy',
    database: {
      state: stateMap[dbState] || 'unknown',
      connected: isConnected(),
    },
    timestamp: new Date().toISOString(),
  });
});

// --------------------
// Start Server
// --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});