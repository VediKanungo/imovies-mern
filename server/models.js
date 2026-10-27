const mongoose = require('mongoose');
const { Schema, model } = mongoose, ref = n => ({ type: Schema.Types.ObjectId, ref: n, required: true });
exports.User = model('User', new Schema({
  name: { type: String, required: true }, email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, role: { type: String, enum: ['user', 'admin'], default: 'user' } }, { timestamps: true }));
const movie = new Schema({ title: { type: String, required: true }, description: String, genre: String,
  language: String, duration: Number, poster: String }, { timestamps: true });
movie.index({ title: 'text' }); movie.index({ genre: 1, language: 1 });
exports.Movie = model('Movie', movie);
exports.Theatre = model('Theatre', new Schema({ name: { type: String, required: true }, city: { type: String, required: true } }));
const show = new Schema({ movie: ref('Movie'), theatre: ref('Theatre'), startTime: { type: Date, required: true },
  price: { type: Number, required: true }, rows: { type: Number, default: 6 }, cols: { type: Number, default: 10 },
  bookedSeats: [String] });
show.index({ movie: 1, startTime: 1 });
exports.Show = model('Show', show);
const booking = new Schema({ user: ref('User'), show: ref('Show'), seats: [String], amount: Number,
  paymentStatus: { type: String, default: 'paid' }, status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' } },
  { timestamps: true });
booking.index({ user: 1, createdAt: -1 });
exports.Booking = model('Booking', booking);
