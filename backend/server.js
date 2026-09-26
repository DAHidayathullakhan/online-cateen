const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();

// Connect Database
connectDB();

// Security and Body Parsing Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes Registration
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/academic', require('./routes/academicRoutes'));
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/pickup-slots', require('./routes/pickupSlotRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/tokens', require('./routes/tokenRoutes'));
app.use('/api/deliveries', require('./routes/deliveryRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/transfers', require('./routes/stockTransferRoutes'));
app.use('/api/food-waste', require('./routes/foodWasteRoutes'));
app.use('/api/offers', require('./routes/offerRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));

// Advanced Feature Routes
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/groups', require('./routes/groupOrderRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/refunds', require('./routes/refundRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/lost-found', require('./routes/lostFoundRoutes'));
app.use('/api/ingredients', require('./routes/ingredientRoutes'));
app.use('/api/catering', require('./routes/eventCateringRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/holidays', require('./routes/holidayRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Campus Canteen Server is operational.', timestamp: new Date() });
});

// Fallback to index.html for SPA page routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`======================================================`);
  console.log(`Smart Campus Canteen Server is running on port ${PORT}`);
  console.log(`Local Access URL: http://localhost:${PORT}`);
  console.log(`======================================================`);
});

module.exports = app;
