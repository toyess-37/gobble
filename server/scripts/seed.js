// for local development; 
// creates test users with hardcoded passwords

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

dotenv.config();

const SEED_USERS = [
  {
    username: 'tester1',
    email: 'tester1@local.dev',
    password: 'password123',
    glicko: { rating: 1500, peakRating: 1500, rd: 350, vol: 0.06 }
  },
  {
    username: 'tester2',
    email: 'tester2@local.dev',
    password: 'password123',
    glicko: { rating: 1600, peakRating: 1600, rd: 300, vol: 0.06 }
  },
  {
    username: 'tester3',
    email: 'tester3@local.dev',
    password: 'password123',
    glicko: { rating: 1400, peakRating: 1400, rd: 350, vol: 0.06 }
  }
];

async function seedDatabase() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not defined in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    for (const userData of SEED_USERS) {
      const existingUser = await User.findOne({ username: userData.username });

      if (existingUser) {
        console.log(`User '${userData.username}' already exists. Skipping.`);
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.password, salt);

      const newUser = new User({
        username: userData.username,
        email: userData.email,
        passwordHash: passwordHash,
        glicko: userData.glicko
      });

      await newUser.save();
      console.log(`Created user '${userData.username}' with password '${userData.password}'.`);
    }
    console.log('\nSeeding complete.');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

seedDatabase();
