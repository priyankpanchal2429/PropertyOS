import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/propertyos';

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

async function seed() {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Database connection successful');

    // 1. Seed Admin User
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
      console.log('[Seed] Admin user created.');
    } else {
      console.log('[Seed] Admin user already exists. Skipping user seed.');
    }

    // 2. Seed Hotel Rooms - Cleaned so user starts with empty rooms database
    console.log('[Seed] Cleaning old rooms database...');
    await Room.deleteMany({});
    console.log('[Seed] Database rooms cleared successfully!');

  } catch (error) {
    console.error('[Seed] Database seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Database connection closed.');
  }
}

seed();
