const r = require('express').Router(); const { Show, Theatre } = require('../models');
const { wrap, protect, admin } = require('../middleware/auth');
r.get('/theatres', wrap(async (req, res) => res.json(await Theatre.find())));
r.post('/theatres', protect, admin, wrap(async (req, res) => res.status(201).json(await Theatre.create(req.body))));
r.get('/', wrap(async (req, res) => {
  const f = { startTime: { $gte: new Date() } };
  if (req.query.movie) f.movie = req.query.movie;
  res.json(await Show.find(f).populate('theatre').sort('startTime'));
}));
r.get('/:id', wrap(async (req, res) => {
  const s = await Show.findById(req.params.id).populate('movie theatre');
  s ? res.json(s) : res.status(404).json({ message: 'Show not found' });
}));
r.post('/', protect, admin, wrap(async (req, res) => res.status(201).json(await Show.create(req.body))));
r.delete('/:id', protect, admin, wrap(async (req, res) => { await Show.findByIdAndDelete(req.params.id); res.json({ ok: true }); }));
module.exports = r;
