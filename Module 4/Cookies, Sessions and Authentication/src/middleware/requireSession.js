const sessionStore = require('../session/sessionStore');
const unauthorized = { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } };

module.exports = function requireSession(req, res, next) {
  const sessionId = req.signedCookies && req.signedCookies.sid;
  // cookie-parser represents invalid signatures as false.
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return res.status(401).json(unauthorized);
  }
  const session = sessionStore.get(sessionId);
  if (!session) return res.status(401).json(unauthorized);
  req.sessionId = sessionId;
  req.session = { userId: session.userId };
  return next();
};
