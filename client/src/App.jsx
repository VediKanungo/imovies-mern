import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Auth, Movies, MovieDetail, Booking, MyBookings, Admin } from './pages.jsx';

function Nav({ user, logout }) {
  const nav = useNavigate();
  return (
    <nav className="navbar navbar-expand px-3 mb-4">
      <Link className="navbar-brand fw-bold" to="/">IMovies</Link>
      <div className="ms-auto d-flex gap-3 align-items-center">
        {user && <Link to="/bookings">My bookings</Link>}
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        {user ? <><span>{user.name}</span><button className="btn btn-sm btn-outline-warning" onClick={() => { logout(); nav('/'); }}>Log out</button></>
          : <><Link to="/login">Log in</Link><Link to="/register">Sign up</Link></>}
      </div>
    </nav>
  );
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const login = u => { localStorage.setItem('user', JSON.stringify(u)); setUser(u); };
  const logout = () => { localStorage.clear(); setUser(null); };
  const need = (el, role) => !user ? <Navigate to="/login" /> : role && user.role !== role ? <Navigate to="/" /> : el;
  return (
    <BrowserRouter>
      <Nav user={user} logout={logout} />
      <div className="container pb-5">
        <Routes>
          <Route path="/" element={<Movies />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/login" element={<Auth mode="login" onLogin={login} />} />
          <Route path="/register" element={<Auth mode="register" onLogin={login} />} />
          <Route path="/book/:id" element={need(<Booking />)} />
          <Route path="/bookings" element={need(<MyBookings />)} />
          <Route path="/admin" element={need(<Admin />, 'admin')} />
        </Routes>
      </div>
      <ToastContainer theme="dark" position="bottom-right" />
    </BrowserRouter>
  );
}
