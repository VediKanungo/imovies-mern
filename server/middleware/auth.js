const jwt = require('jsonwebtoken');
const { User } = require('../models');
exports.wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.protect = async (req, res, next) => {
  try {
    const t = (req.headers.authorization || '').split(' ')[1];
    if (!t) return res.status(401).json({ message: 'Please log in' });
    req.user = await User.findById(jwt.verify(t, process.env.JWT_SECRET).id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch { res.status(401).json({ message: 'Invalid or expired token' }); }
};
exports.admin = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admins only' });
