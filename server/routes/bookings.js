const r = require('express').Router(); const { Show, Booking } = require('../models');
const { wrap, protect } = require('../middleware/auth');
r.use(protect);
r.post('/', wrap(async (req, res) => {
  const { show, seats } = req.body;
  if (!Array.isArray(seats) || !seats.length || seats.length > 8) return res.status(400).json({ message: 'Select 1 to 8 seats' });
  const s = await Show.findById(show);
  if (!s || s.startTime < new Date()) return res.status(400).json({ message: 'Show is not available' });
  const valid = new Set(); for (let i = 0; i < s.rows; i++) for (let j = 1; j <= s.cols; j++) valid.add(String.fromCharCode(65 + i) + j);
  if (new Set(seats).size !== seats.length || !seats.every(x => valid.has(x))) return res.status(400).json({ message: 'Invalid seats' });
  // Atomic: succeeds only if none of the requested seats are already booked
  const upd = await Show.findOneAndUpdate({ _id: show, bookedSeats: { $nin: seats } },
    { $addToSet: { bookedSeats: { $each: seats } } }, { new: true });
  if (!upd) return res.status(409).json({ message: 'Some seats were just taken. Please pick others.' });
  const b = await Booking.create({ user: req.user._id, show, seats, amount: seats.length * s.price }); // payment is simulated
  req.app.get('io').to(String(show)).emit('seats', upd.bookedSeats);
  res.status(201).json(b);
}));
r.get('/mine', wrap(async (req, res) => {
  const page = +req.query.page || 1, limit = 10;
  res.json(await Booking.find({ user: req.user._id }).sort('-createdAt').skip((page - 1) * limit).limit(limit)
    .populate({ path: 'show', populate: ['movie', 'theatre'] }));
}));
r.put('/:id/cancel', wrap(async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, user: req.user._id }).populate('show');
  if (!b || b.status === 'cancelled') return res.status(404).json({ message: 'Booking not found' });
  if (b.show.startTime < new Date()) return res.status(400).json({ message: 'Past shows cannot be cancelled' });
  b.status = 'cancelled'; await b.save();
  const upd = await Show.findByIdAndUpdate(b.show._id, { $pull: { bookedSeats: { $in: b.seats } } }, { new: true });
  req.app.get('io').to(String(b.show._id)).emit('seats', upd.bookedSeats);
  res.json(b);
}));
module.exports = r;
