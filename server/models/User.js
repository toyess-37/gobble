import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  passwordHash: String,
  role: { type: String, enum: ['user', 'guest'], default: 'user' },

  glicko: {
    rating: { type: Number, default: 1500 },
    peakRating: {type: Number, default: 1500 },
    rd: { type: Number, default: 350 },
    vol: { type: Number, default: 0.06 }
  },

  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
  },

  social: {
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },

  preferences: {
    showHints: { type: Boolean, default: false },
    enableVisualizer: { type: Boolean, default: true }
  },

  refreshTokens: [{
    family: String,
    tokenId: String,
    previousTokenId: String,
    rotatedAt: Date,
    createdAt: Date
  }],

  flags: [{
    reason: String,
    gameId: String,
    timestamp: Date
  }],

  lastGameAt: Date,
}, { timestamps: true });

UserSchema.index({ 'glicko.rating': -1 });

export const User = mongoose.model('User', UserSchema);