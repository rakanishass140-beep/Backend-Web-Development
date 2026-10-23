const prisma = require('../db/prisma');
function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}
function findSafeById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
}
module.exports = { findByEmail, findSafeById };
