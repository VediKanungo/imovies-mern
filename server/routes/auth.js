const r = require('express').Router(), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { User } = require('../models'); const { wrap, protect } = require('../middleware/auth');
const sign = u => ({ token: jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' }),
  user: { id: u._id, name: u.name, email: u.email, role: u.role } });
r.post('/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: 'Name, email and a 6+ character password are required' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email already registered' });
  res.status(201).json(sign(await User.create({ name, email, password: await bcrypt.hash(password, 10) })));
}));
r.post('/login', wrap(async (req, res) => {
  const u = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password))) return res.status(401).json({ message: 'Wrong email or password' });
  res.json(sign(u));
}));
r.get('/me', protect, (req, res) => res.json(req.user));
module.exports = r;
