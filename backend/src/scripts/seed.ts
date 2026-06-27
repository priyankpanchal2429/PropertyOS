import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/propertyos';

async function seed() {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Database connection successful');

    const adminUsername = 'teju001';
    const adminEmail = 'admin@propertyos.com';

    const existingAdmin = await User.findOne({
      $or: [{ username: adminUsername }, { email: adminEmail }],
    });

    if (existingAdmin) {
      console.log(`[Seed] Admin user already exists (Username: ${existingAdmin.username}, Email: ${existingAdmin.email}). Skipping seeding.`);
    } else {
      const passwordHash = await bcrypt.hash('Sim001', 12);
      await User.create({
        name: 'Teju Admin',
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        role: 'Admin',
        isActive: true,
      });
      console.log('[Seed] Temporary Admin account successfully seeded!');
      console.log(`- Username: ${adminUsername}`);
      console.log('- Password: [Seeded Hashed]');
    }
  } catch (error) {
    console.error('[Seed] Database seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Database connection closed.');
  }
}

seed();
