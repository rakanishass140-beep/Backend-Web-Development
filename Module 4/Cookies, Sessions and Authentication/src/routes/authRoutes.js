const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const userRepository = require('../repositories/userRepository');
const sessionStore = require('../session/sessionStore');
const requireSession = require('../middleware/requireSession');
const { cookieOptions, clearCookieOptions, sessionTtlMs } = require('../session/cookieConfig');

const router = express.Router();
const invalidCredentials = {
  error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
};
const unauthorized = {
  error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
};
const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0;
const safeUser = user => ({ id: user.id, name: user.name, email: user.email });

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Email and password are required' },
      });
    }

    const user = await userRepository.findByEmail(email.trim().toLowerCase());
    if (!user) return res.status(401).json(invalidCredentials);

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) return res.status(401).json(invalidCredentials);

    const sessionId = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + sessionTtlMs);
    sessionStore.create(sessionId, { userId: user.id, expiresAt });

    res.cookie('sid', sessionId, cookieOptions);
    return res.status(200).json(safeUser(user));
  } catch {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
});

router.get('/me', requireSession, async (req, res) => {
  try {
    const user = await userRepository.findSafeById(req.session.userId);
    if (!user) {
      sessionStore.destroy(req.sessionId);
      res.clearCookie('sid', clearCookieOptions);
      return res.status(401).json(unauthorized);
    }
    return res.status(200).json(safeUser(user));
  } catch {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
});

router.post('/logout', (req, res) => {
  try {
    const sessionId = req.signedCookies && req.signedCookies.sid;
    if (typeof sessionId === 'string') sessionStore.destroy(sessionId);
    res.clearCookie('sid', clearCookieOptions);
    return res.status(204).end();
  } catch {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
});

module.exports = router;
