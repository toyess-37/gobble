import mongoose from 'mongoose';

const GameSessionSchema = new mongoose.Schema({
  _id: { type: String }, // roomId
  isRated: { type: Boolean, default: true },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  mapConfig: {
    rows: [Number],
    cols: [Number],
    pink: [[Number]]
  },
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    playerNumber: Number,
    finalScore: Number
  }],
  moves: [{
    turnNumber: Number,
    player: Number,
    row: Number,
    col: Number,
    tile: String,
    effectiveTile: String,
    timestamp: Date
  }],
  boardSnapshot: { type: mongoose.Schema.Types.Mixed },
  lineResults: [{
    lineType: { type: String, enum: ['row', 'col'] },
    index: Number,
    expression: String,
    result: Number,
    winner: Number,
    contributions: { p1: Number, p2: Number }
  }],
  analysis: [{
    turnNumber: Number,
    accuracy: Number,
    optimalMove: { type: mongoose.Schema.Types.Mixed },
    missedScore: Number
  }],
  winner: Number,
  scores: { p1: { type: Number, default: 0 }, p2: { type: Number, default: 0 } },
  duration: Number,
  completedAt: Date
}, { timestamps: true });

GameSessionSchema.index({ 'players.userId': 1 });

export const GameSession = mongoose.model('GameSession', GameSessionSchema);
