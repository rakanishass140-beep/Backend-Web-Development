const sessions = new Map();

function create(sessionId, session) {
  sessions.set(sessionId, { userId: session.userId, expiresAt: new Date(session.expiresAt) });
}
function get(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (!(session.expiresAt instanceof Date) || session.expiresAt.getTime() <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }
  return { userId: session.userId, expiresAt: new Date(session.expiresAt) };
}
function destroy(sessionId) {
  if (typeof sessionId === 'string' && sessionId.length > 0) sessions.delete(sessionId);
}
module.exports = { create, get, destroy };
