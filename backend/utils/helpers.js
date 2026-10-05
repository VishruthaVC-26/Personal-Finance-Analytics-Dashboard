const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const generateId = () => uuidv4();

const hashPassword = async (password) => {
  const bcrypt = require('bcryptjs');
  return bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hash);
};

const signToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

module.exports = {
  generateId,
  hashPassword,
  comparePassword,
  signToken,
  setTokenCookie
};
