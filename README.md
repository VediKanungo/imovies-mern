# IMovies – MERN movie ticket booking
## Run
1. Install Node 16+ and MongoDB (or use an Atlas URI).
2. Backend: `cd server && cp .env.example .env && npm install && npm run seed && npm run dev`
3. Frontend: `cd client && npm install && npm run dev` → http://localhost:5173
Admin login after seeding: admin@imovies.com / admin123
## Features
JWT auth + User/Admin roles, bcrypt, movie search/filter/pagination, shows, real-time seat map (socket.io), atomic seat booking (no double booking), mock payment, booking history + cancellation, admin panel, rate limiting, central error handling, Mongo indexes.
