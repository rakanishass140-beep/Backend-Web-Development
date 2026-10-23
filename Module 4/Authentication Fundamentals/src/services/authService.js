const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');

const INVALID_CREDENTIALS = {
  error: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
  },
};

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function requireNonEmptyStrings(payload, fields) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new HttpError(400, 'INVALID_INPUT', 'Request body must be an object');
  }

  for (const field of fields) {
    if (typeof payload[field] !== 'string' || payload[field].trim().length === 0) {
      throw new HttpError(400, 'INVALID_INPUT', `${field} must be a non-empty string`);
    }
  }
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function serializeUser(user) {
  // Explicit allowlist: credentials and other internal fields never leave the API.
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

async function register(payload) {
  requireNonEmptyStrings(payload, ['name', 'email', 'password']);

  const name = payload.name.trim();
  const email = normalizeEmail(payload.email);
  const password = payload.password;

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new HttpError(409, 'EMAIL_ALREADY_EXISTS', 'Email already exists');
  }

  const cost = Number.parseInt(process.env.BCRYPT_COST, 10) || 12;
  const passwordHash = await bcrypt.hash(password, cost);

  try {
    const user = await userRepository.create({ name, email, passwordHash });
    return serializeUser(user);
  } catch (error) {
    // Protect against a concurrent registration racing the initial lookup.
    if (error && error.code === 'P2002') {
      throw new HttpError(409, 'EMAIL_ALREADY_EXISTS', 'Email already exists');
    }
    throw error;
  }
}

async function login(payload) {
  requireNonEmptyStrings(payload, ['email', 'password']);

  const email = normalizeEmail(payload.email);
  const user = await userRepository.findByEmail(email);

  // Keep both credential-failure cases on the same response path and body.
  if (!user) return null;

  const validPassword = await bcrypt.compare(payload.password, user.passwordHash);
  if (!validPassword) return null;

  return serializeUser(user);
}

module.exports = { register, login, INVALID_CREDENTIALS };
