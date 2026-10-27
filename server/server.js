require('dotenv').config();
const express = require('express'), mongoose = require('mongoose'), cors = require('cors'),
  http = require('http'), rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const app = express(), server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);
app.use(cors());
app.use(express.json());
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/shows', require('./routes/shows'));
app.use('/api/bookings', require('./routes/bookings'));
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});
io.on('connection', s => s.on('join', id => s.join(String(id))));
mongoose.connect(process.env.MONGO_URI)
  .then(() => server.listen(process.env.PORT || 5000, () => console.log('API running')))
  .catch(e => { console.error('Mongo connection failed:', e.message); process.exit(1); });
