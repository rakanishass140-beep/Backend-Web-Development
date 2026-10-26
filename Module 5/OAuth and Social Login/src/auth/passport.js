'use strict';
// auth/passport.js — Google OAuth strategy

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { users, nextId } = require('../data');

async function verifyCallback(accessToken, refreshToken, profile, done) {
  try {
    // 1. A stable Google ID takes precedence over email.
    const returningUser = users.find((user) => user.googleId === profile.id);
    if (returningUser) {
      return done(null, returningUser);
    }

    // 2. Link an existing local account only when Google verifies its email.
    const email = profile.emails[0].value;
    const existingUser = users.find((user) => user.email === email);
    if (existingUser) {
      if (profile._json.email_verified !== true) {
        return done(null, false);
      }

      existingUser.googleId = profile.id;
      return done(null, existingUser);
    }

    // 3. No matching identity or local account: create a least-privilege user.
    const newUser = {
      id: nextId(),
      googleId: profile.id,
      email,
      name: profile.displayName,
      role: 'member',
    };
    users.push(newUser);
    return done(null, newUser);
  } catch (err) {
    return done(err);
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'test-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret',
      callbackURL: '/auth/google/callback',
    },
    verifyCallback,
  ),
);

module.exports = { passport, verifyCallback };
