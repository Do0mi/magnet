const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieSession = require('cookie-session');
const passport = require('passport');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth-routes');
const userRoutes = require('./routes/user-routes');
const productRoutes = require('./routes/product-routes');

// Config
require('./config/passport-setup');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up session
app.use(cookieSession({
  maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
  keys: [process.env.COOKIE_KEY || 'magnetdefaultsecretkey'],
  secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
  sameSite: 'lax', // Allow cross-site requests
  httpOnly: true
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/magnet-project')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Drop the problematic identifier index if it exists
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const usersCollection = collections.find(col => col.name === 'users');
      
      if (usersCollection) {
        const indexes = await db.collection('users').indexes();
        const identifierIndex = indexes.find(index => index.name === 'identifier_1');
        
        if (identifierIndex) {
          await db.collection('users').dropIndex('identifier_1');
          console.log('Dropped problematic identifier_1 index');
        }
      }
    } catch (error) {
      console.log('Index cleanup completed (or no problematic index found)');
    }
  })
  .catch(err => console.error('Could not connect to MongoDB', err));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
  next();
});

// CORS middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://127.0.0.1:5501',
    'https://magnet-project.vercel.app',
    'https://magnet-project.vercel.app/'
  ];
  const origin = req.headers.origin;
  
  console.log('CORS check - Origin:', origin);
  
  // More flexible CORS handling for Vercel deployment
  if (origin) {
    // Allow if it's in our allowed list
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      console.log('CORS allowed for origin (exact match):', origin);
    }
    // Allow if it's a Vercel subdomain
    else if (origin.includes('vercel.app') || origin.includes('magnet-project')) {
      res.header('Access-Control-Allow-Origin', origin);
      console.log('CORS allowed for origin (Vercel subdomain):', origin);
    }
    // Allow if it's localhost (for development)
    else if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      res.header('Access-Control-Allow-Origin', origin);
      console.log('CORS allowed for origin (localhost):', origin);
    }
    else {
      console.log('CORS blocked for origin:', origin);
    }
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error', 
    message: err.message || 'Something went wrong on the server' 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
