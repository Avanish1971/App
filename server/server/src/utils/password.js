// Password ko hash karke rakho (plain text nahi). Koi extra package nahi.
const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scrypt(String(password), salt, 64);
  return `scrypt$${salt}$${buf.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [alg, salt, hash] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const buf = await scrypt(String(password), salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === buf.length && crypto.timingSafeEqual(expected, buf);
}

module.exports = { hashPassword, verifyPassword };
