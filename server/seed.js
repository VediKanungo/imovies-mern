require('dotenv').config();
const mongoose = require('mongoose'), bcrypt = require('bcryptjs'); const M = require('./models');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all(Object.values(M).map(m => m.deleteMany()));
  await M.User.create({ name: 'Admin', email: 'admin@imovies.com', password: await bcrypt.hash('admin123', 10), role: 'admin' });
  const t = await M.Theatre.create({ name: 'PVR Central', city: 'Indore' });
  const movies = await M.Movie.insertMany([
    { title: 'Midnight Express', genre: 'Thriller', language: 'English', duration: 120, description: 'A tense night train ride.' },
    { title: 'Dil Ki Baat', genre: 'Romance', language: 'Hindi', duration: 140, description: 'A heartfelt love story.' },
    { title: 'Space Run', genre: 'Sci-Fi', language: 'English', duration: 130, description: 'A race across the galaxy.' }]);
  for (const m of movies) for (const d of [1, 2]) await M.Show.create({ movie: m._id, theatre: t._id, price: 200,
    startTime: new Date(Date.now() + d * 864e5) });
  console.log('Seeded. Admin: admin@imovies.com / admin123'); process.exit();
})();
