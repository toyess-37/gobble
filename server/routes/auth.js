import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';

const router = express.Router();
const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';
const REFRESH_COOKIE_AGE = 7 * 24 * 60 * 60 * 1000;

// Pre-hashed dummy for constant-time comparison when user doesn't exist
const DUMMY_HASH = '$2a$10$nOUIs5kJ7naTuTFkBy1veuK0kSxUFXfuaOKdOKf9xYT0KKIGSJwFa';

function signAccess(user) {
  return jwt.sign(
    { userId: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefresh(userId, tokenId, family) {
  return jwt.sign(
    { userId, tokenId, family, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_TTL }
  );
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_COOKIE_AGE,
    path: '/api/auth'
  });
}

function userResponse(user) {
  return { id: user._id, username: user.username, role: user.role, glicko: user.glicko };
}

// adds a refresh token family to the user doc. caller must save().
function attachRefresh(user, res) {
  const now = Date.now();
  user.refreshTokens = user.refreshTokens.filter(t => t.createdAt && (now - new Date(t.createdAt).getTime() < REFRESH_COOKIE_AGE));
  const family = crypto.randomUUID();
  const tokenId = crypto.randomUUID();
  user.refreshTokens.push({ family, tokenId, createdAt: new Date() });
  setRefreshCookie(res, signRefresh(user._id, tokenId, family));
}

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Username and password required' });
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    if (password.trim().length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ error: 'Username already taken' });

    const hash = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const fields = { username, passwordHash: hash };
    if (email) fields.email = email;

    const user = new User(fields);
    attachRefresh(user, res);
    await user.save();

    res.status(201).json({ token: signAccess(user), user: userResponse(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Username already taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Username and password required' });
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username });
    const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
    if (!user || !user.passwordHash || !ok) return res.status(400).json({ error: 'Invalid credentials' });

    attachRefresh(user, res);
    await user.save();

    res.json({ token: signAccess(user), user: userResponse(user) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/guest', async (req, res) => {
  try {
    const tag = crypto.randomBytes(4).toString('hex');
    const user = new User({ username: `Guest_${tag}`, role: 'guest' });
    attachRefresh(user, res);
    await user.save();

    res.status(201).json({ token: signAccess(user), user: userResponse(user) });
  } catch (err) {
    if (err.code === 11000) {
      try {
        const tag2 = crypto.randomBytes(4).toString('hex');
        const user = new User({ username: `Guest_${tag2}`, role: 'guest' });
        attachRefresh(user, res);
        await user.save();
        return res.status(201).json({ token: signAccess(user), user: userResponse(user) });
      } catch (retryErr) {
        return res.status(500).json({ error: 'Server error' });
      }
    }
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const raw = req.cookies?.refreshToken;
    if (!raw) return res.status(401).json({ error: 'No refresh token' });

    let claims;
    try {
      claims = jwt.verify(raw, process.env.JWT_SECRET);
    } catch {
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (claims.type !== 'refresh') {
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({ error: 'Wrong token type' });
    }

    // Atomic rotation: only succeeds if family+tokenId still match
    const newId = crypto.randomUUID();
    const updated = await User.findOneAndUpdate(
      { _id: claims.userId, refreshTokens: { $elemMatch: { family: claims.family, tokenId: claims.tokenId } } },
      { $set: { 
          'refreshTokens.$.tokenId': newId, 
          'refreshTokens.$.previousTokenId': claims.tokenId,
          'refreshTokens.$.rotatedAt': new Date(),
          'refreshTokens.$.createdAt': new Date() 
      } },
      { new: true }
    );

    if (updated) {
      setRefreshCookie(res, signRefresh(updated._id, newId, claims.family));
      return res.json({ token: signAccess(updated), user: userResponse(updated) });
    }

    // Grace period: this might be a legitimate concurrent request for a token
    // that was JUST rotated away by another request a moment ago.
    const GRACE_MS = 10000;
    const graceUser = await User.findOne({
      _id: claims.userId,
      refreshTokens: { $elemMatch: {
        family: claims.family,
        previousTokenId: claims.tokenId,
        rotatedAt: { $gte: new Date(Date.now() - GRACE_MS) }
      } }
    });

    if (graceUser) {
      const entry = graceUser.refreshTokens.find(t => t.family === claims.family);
      setRefreshCookie(res, signRefresh(graceUser._id, entry.tokenId, claims.family));
      return res.json({ token: signAccess(graceUser), user: userResponse(graceUser) });
    }

    // Rotation failed — figure out why
    const user = await User.findById(claims.userId);
    if (!user) {
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({ error: 'User not found' });
    }

    const hasFamily = user.refreshTokens.some(t => t.family === claims.family);
    if (!hasFamily) {
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({ error: 'Session expired' });
    }

    // Family exists but tokenId didn't match — reuse detected
    user.refreshTokens = [];
    await user.save();
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return res.status(401).json({ error: 'Token reuse detected, all sessions revoked' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', async (req, res) => {
  const raw = req.cookies?.refreshToken;
  if (!raw) return res.sendStatus(204);

  try {
    const claims = jwt.verify(raw, process.env.JWT_SECRET);
    const user = await User.findById(claims.userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(t => t.family !== claims.family);
      await user.save();
    }
  } catch {
    // expired or tampered - just clear the cookie
  }

  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.sendStatus(204);
});

export default router;