const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieSession = require('cookie-session');
const passport = require('passport');
const path = require('path');
const cors = require('cors');

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
  keys: [process.env.COOKIE_KEY || 'magnetdefaultsecretkey']
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

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', 
      'http://127.0.0.1:5501',
      'https://magnet-project.vercel.app',
      'https://magnet-project.vercel.app/'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Vercel subdomains
    if (origin.includes('vercel.app') || origin.includes('magnet-project')) {
      return callback(null, true);
    }
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

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
