const sessionTtlMs = Number.parseInt(process.env.SESSION_TTL_MS, 10) || 60 * 60 * 1000;
const secure = process.env.COOKIE_SECURE === 'true';
const cookieOptions = Object.freeze({
  httpOnly: true,
  sameSite: 'lax',
  secure,
  signed: true,
  path: '/',
  maxAge: sessionTtlMs,
});
const clearCookieOptions = Object.freeze({
  httpOnly: cookieOptions.httpOnly,
  sameSite: cookieOptions.sameSite,
  secure: cookieOptions.secure,
  signed: cookieOptions.signed,
  path: cookieOptions.path,
});
module.exports = { cookieOptions, clearCookieOptions, sessionTtlMs };
