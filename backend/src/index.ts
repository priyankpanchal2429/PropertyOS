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
import { Room } from './models/Room.js';
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

    // Auto-seed rooms database on startup if empty
    const roomCount = await Room.countDocuments();
    if (roomCount === 0) {
      const queenRooms = ['116', '118', '221'];
      const kingRooms = [
        '102', '103', '108', '114', '200', '201', '202', '203', '204',
        '205', '213', '214', '216', '217', '218', '220', '223', '224',
        '228', '229', '230'
      ];
      const adaRooms = ['104', '105'];
      const doubleQueenRooms = [
        '100', '101', '106', '107', '109', '110', '111', '112', '113',
        '115', '117', '206', '207', '208', '209', '210', '211', '212',
        '215', '219', '222', '225', '226', '227'
      ];
      const sampleGuests = [
        'Alice Smith', 'Bob Johnson', 'Charlie Williams', 'Diana Brown',
        'Ethan Jones', 'Fiona Miller', 'George Davis', 'Hannah Wilson'
      ];

      const allRoomsToSeed: any[] = [];
      const getSample = (i: number) => {
        const mod = i % 10;
        if (mod === 0 || mod === 3) {
          return { status: 'Occupied' as const, currentGuestName: sampleGuests[i % sampleGuests.length] };
        }
        if (mod === 5) {
          return { status: 'Dirty' as const, currentGuestName: undefined };
        }
        return { status: 'Vacant' as const, currentGuestName: undefined };
      };

      let idx = 0;
      queenRooms.forEach((num) => {
        const { status, currentGuestName } = getSample(idx++);
        allRoomsToSeed.push({ number: num, type: '1 Queen Bed', status, currentGuestName });
      });
      kingRooms.forEach((num) => {
        const { status, currentGuestName } = getSample(idx++);
        allRoomsToSeed.push({ number: num, type: '1 King Bed', status, currentGuestName });
      });
      adaRooms.forEach((num) => {
        const { status, currentGuestName } = getSample(idx++);
        allRoomsToSeed.push({ number: num, type: '1 King ADA', status, currentGuestName });
      });
      doubleQueenRooms.forEach((num) => {
        const { status, currentGuestName } = getSample(idx++);
        allRoomsToSeed.push({ number: num, type: '2 Queen Beds', status, currentGuestName });
      });

      await Room.insertMany(allRoomsToSeed);
      console.log('[Startup] Seeding complete: Seeded 50 default hotel rooms.');
    } else {
      console.log('[Startup] Seeding bypassed: Rooms database already seeded.');
    }
  } catch (seedErr) {
    console.error('[Startup] Failed to auto-seed database:', seedErr);
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
