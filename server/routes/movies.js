const r = require('express').Router(); const { Movie } = require('../models');
const { wrap, protect, admin } = require('../middleware/auth');
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
r.get('/', wrap(async (req, res) => {
  const { q, genre, language, page = 1, limit = 8 } = req.query, f = {};
  if (q) f.title = new RegExp(esc(q), 'i');
  if (genre) f.genre = genre; if (language) f.language = language;
  const [items, total] = await Promise.all([
    Movie.find(f).sort('-createdAt').skip((page - 1) * limit).limit(+limit), Movie.countDocuments(f)]);
  res.json({ items, total, pages: Math.ceil(total / limit) });
}));
r.get('/:id', wrap(async (req, res) => {
  const m = await Movie.findById(req.params.id); m ? res.json(m) : res.status(404).json({ message: 'Movie not found' });
}));
r.post('/', protect, admin, wrap(async (req, res) => res.status(201).json(await Movie.create(req.body))));
r.put('/:id', protect, admin, wrap(async (req, res) => res.json(await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true }))));
r.delete('/:id', protect, admin, wrap(async (req, res) => { await Movie.findByIdAndDelete(req.params.id); res.json({ ok: true }); }));
module.exports = r;
