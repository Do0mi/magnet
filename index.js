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

// New API v1 Routes
const dashboardRoutes = require('./routes/dashboard');
const businessRoutes = require('./routes/business');
const userRoutes = require('./routes/user');

// Currency service and cron job
const { initializeRates } = require('./services/currency-service');
const { startCurrencyUpdateJob } = require('./jobs/currency-update-job');

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
  maxAge: 24 * 60 * 60 * 1000,
  keys: [process.env.COOKIE_KEY || 'magnetdefaultsecretkey']
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/magnet-project')
  .then(async () => {
    console.log('Connected to MongoDB');

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

    // Initialize currency exchange rates on startup
    console.log('Initializing currency exchange rates...');
    try {
      await initializeRates();
      console.log('Currency exchange rates initialized successfully');
    } catch (error) {
      console.error('Failed to initialize currency rates:', error.message);
      console.log('Server will continue with default rates (USD only)');
    }

    // Start hourly currency update cron job
    startCurrencyUpdateJob();
  })
  .catch(err => {
    console.error('Could not connect to MongoDB', err);
    process.exit(1);
  });

// CORS configuration (temporarily simplified for deployment)
app.use(cors({
  origin: '*', // <-- Replace this with specific origins in production
  credentials: true
}));

// Socket.IO setup
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    socket.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'magnetprojecttokensecret');
    socket.user = decoded;
    next();
  } catch (err) {
    socket.user = null;
    next();
  }
});

io.on('connection', (socket) => {
  socket.on('joinOrderRoom', async (orderId) => {
    const user = socket.user;
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) return;

    if (user?.role === 'admin' || user?.role === 'magnet_employee') {
      socket.join(`order_${orderId}`);
      return;
    }

    if (user?.role === 'customer' && order.customer.toString() === user.id) {
      socket.join(`order_${orderId}`);
      return;
    }

    if (user?.role === 'business') {
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

// API v1 Routes
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/user', userRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Health check passed' });
});

// Root route
app.get('/', (req, res) => {
  res.send('Server is up and running! (API root)');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Something went wrong on the server'
  });
});

// Start server
server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
