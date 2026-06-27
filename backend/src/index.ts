import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import {
  corsMiddleware,
  helmetMiddleware,
  apiRateLimiter,
  mongoSanitizeMiddleware,
  xssSanitizerMiddleware,
} from './middleware/security.js';
import { errorHandler } from './middleware/error.js';
import apiRoutes from './routes/index.js';
import { User } from './models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB().then(async () => {
  // Auto-seed admin user on startup if not present
  try {
    const adminUsername = 'teju001';
    const adminEmail = 'admin@propertyos.com';
    const existingAdmin = await User.findOne({
      $or: [{ username: adminUsername }, { email: adminEmail }],
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('Sim001', 12);
      await User.create({
        name: 'Teju Admin',
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        role: 'Admin',
        isActive: true,
      });
      console.log('[Startup] Seeding complete: Created default admin account (Teju001 / Sim001).');
    } else {
      console.log('[Startup] Seeding bypassed: Admin account already exists.');
    }
  } catch (seedErr) {
    console.error('[Startup] Failed to auto-seed default admin:', seedErr);
  }
});

// Middleware chains
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan('dev'));

// Database injection and XSS sanitation middlewares
app.use(mongoSanitizeMiddleware);
app.use(xssSanitizerMiddleware);

// Apply API limiters to all endpoints except auth routes which have their own limits
app.use('/api', apiRateLimiter);

// API router configurations
app.use('/api', apiRoutes);

// Catch-all 404 Route
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: 'Endpoint not found',
  });
});

// Global central error handler
app.use(errorHandler);

// Listen
app.listen(PORT, () => {
  console.log(`[Server] PropertyOS Express Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
