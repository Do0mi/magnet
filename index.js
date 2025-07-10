const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieSession = require('cookie-session');
const passport = require('passport');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const Order = require('./models/order-model');
const Product = require('./models/product-model');

// Routes
const authRoutes = require('./routes/auth-routes');
const userRoutes = require('./routes/user-routes');
const productRoutes = require('./routes/product-routes');
const categoryRoutes = require('./routes/category-routes');
const orderRoutes = require('./routes/order-routes');
const reviewRoutes = require('./routes/review-routes');
const wishlistRoutes = require('./routes/wishlist-routes');
const addressRoutes = require('./routes/address-routes');

// Config
require('./config/passport-setup');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });
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
      'https://magnet-le5t.onrender.com'
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

// Socket.IO setup
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'magnetprojecttokensecret');
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  socket.on('joinOrderRoom', async (orderId) => {
    const user = socket.user;
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) return;
    // Admin/Employee: always allowed
    if (user.role === 'admin' || user.role === 'magnet_employee') {
      socket.join(`order_${orderId}`);
      return;
    }
    // Customer: only if they are the order's customer
    if (user.role === 'customer' && order.customer.toString() === user.id) {
      socket.join(`order_${orderId}`);
      return;
    }
    // Business: only if any product in the order is owned by them
    if (user.role === 'business') {
      const ownsProduct = order.items.some(item =>
        item.product && item.product.owner && item.product.owner.toString() === user.id
      );
      if (ownsProduct) {
        socket.join(`order_${orderId}`);
      }
    }
  });
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error', 
    message: err.message || 'Something went wrong on the server' 
  });
});

// Start server with Socket.IO
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
