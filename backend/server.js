const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Connect Database
connectDB().then(async () => {
  try {
    const MenuItem = require('./models/MenuItem');
    const count = await MenuItem.countDocuments();
    if (count === 0) {
      console.log('Database empty. Automatically seeding menu catalog & campus models...');
      const seedData = require('../scripts/seed');
      await seedData();
      console.log('Auto-seed completed successfully!');
    }
  } catch (seedErr) {
    console.warn('Auto-seed check/execution:', seedErr.message);
  }
});

// Security and Body Parsing Middleware
const compression = require('compression');
app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend (built dist first, then raw frontend and public assets)
const fs = require('fs');
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Real Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  
  res.json({
    success: dbState === 1,
    server: 'ok',
    database: dbStatus,
    timestamp: new Date()
  });
});

// Upload route for real dish photographs (Admin & Canteen Operator)
const multer = require('multer');
const uploadDir = path.join(__dirname, '../public/images/food/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `dish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only real photograph files (.jpg, .jpeg, .png, .webp) are allowed.'));
  }
});

const { protect, authorize } = require('./middleware/authMiddleware');
app.post('/api/upload', protect, authorize('Admin', 'Canteen Operator'), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
  }
  const imageUrl = `/images/food/uploads/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Food photograph uploaded successfully.',
    imageUrl
  });
});

// API Routes Registration
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/tokens', require('./routes/tokenRoutes'));
app.use('/api/cash-register', require('./routes/cashRegisterRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/crowd', require('./routes/crowdRoutes'));

// API 404 Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API endpoint ${req.originalUrl} not found.` });
});

// Fallback to index.html for SPA page routes
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = parseInt(process.env.PORT, 10) || 3000;
if (require.main === module) {
  const primaryServer = app.listen(PORT, () => {
    console.log(`======================================================`);
    console.log(`Smart Campus Canteen Server is running on port ${PORT}`);
    console.log(`Primary URL: http://localhost:${PORT}`);
    console.log(`======================================================`);
  });

  // Also bind to 3838 so requests to 127.0.0.1:3838 connect seamlessly
  if (PORT !== 3838) {
    try {
      const secondaryServer = app.listen(3838, () => {
        console.log(`Dual-Port Listener active on port 3838: http://127.0.0.1:3838`);
      });
      secondaryServer.on('error', (err) => {
        console.log(`Note: Port 3838 secondary listener (${err.message}) - running on primary ${PORT}.`);
      });
    } catch (bindErr) {
      console.log(`Secondary listener error:`, bindErr.message);
    }
  }
}

module.exports = app;
