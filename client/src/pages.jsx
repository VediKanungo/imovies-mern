import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { api, errMsg } from './api.js';

const fmt = d => new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export function Auth({ mode, onLogin }) {
  const [f, setF] = useState({ name: '', email: '', password: '' }), nav = useNavigate();
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const submit = async e => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/' + mode, f);
      localStorage.setItem('token', data.token); onLogin(data.user); toast.success('Welcome, ' + data.user.name); nav('/');
    } catch (er) { toast.error(errMsg(er)); }
  };
  return (
    <form onSubmit={submit} className="mx-auto" style={{ maxWidth: 380 }}>
      <h3 className="mb-3">{mode === 'login' ? 'Log in' : 'Create your account'}</h3>
      {mode === 'register' && <input className="form-control mb-2" placeholder="Name" value={f.name} onChange={set('name')} required />}
      <input className="form-control mb-2" type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
      <input className="form-control mb-3" type="password" placeholder="Password (6+ characters)" value={f.password} onChange={set('password')} required />
      <button className="btn btn-warning w-100">{mode === 'login' ? 'Log in' : 'Sign up'}</button>
    </form>
  );
}

export function Movies() {
  const [q, setQ] = useState({ q: '', genre: '', language: '', page: 1 }), [d, setD] = useState({ items: [], pages: 1 });
  useEffect(() => { api.get('/movies', { params: q }).then(r => setD(r.data)).catch(e => toast.error(errMsg(e))); }, [q]);
  const set = k => e => setQ({ ...q, [k]: e.target.value, page: 1 });
  return (
    <>
      <div className="row g-2 mb-4">
        <div className="col-md-6"><input className="form-control" placeholder="Search movies" value={q.q} onChange={set('q')} /></div>
        <div className="col-md-3"><select className="form-select" value={q.genre} onChange={set('genre')}>
          <option value="">All genres</option>{['Thriller', 'Romance', 'Sci-Fi', 'Comedy', 'Action', 'Drama'].map(g => <option key={g}>{g}</option>)}</select></div>
        <div className="col-md-3"><select className="form-select" value={q.language} onChange={set('language')}>
          <option value="">All languages</option>{['English', 'Hindi', 'Tamil', 'Telugu'].map(g => <option key={g}>{g}</option>)}</select></div>
      </div>
      <div className="row g-3">
        {d.items.map(m => (
          <div className="col-6 col-md-3" key={m._id}><Link to={'/movie/' + m._id} className="text-decoration-none"><div className="card h-100">
            <div className="poster">{m.title}</div>
            <div className="card-body"><small>{m.genre} · {m.language}</small></div></div></Link></div>))}
        {!d.items.length && <p>No movies match your search. Try clearing the filters.</p>}
      </div>
      <div className="d-flex gap-2 mt-4 align-items-center">
        <button className="btn btn-outline-warning btn-sm" disabled={q.page <= 1} onClick={() => setQ({ ...q, page: q.page - 1 })}>Previous</button>
        <span>Page {q.page} of {d.pages || 1}</span>
        <button className="btn btn-outline-warning btn-sm" disabled={q.page >= d.pages} onClick={() => setQ({ ...q, page: q.page + 1 })}>Next</button>
      </div>
    </>
  );
}

export function MovieDetail() {
  const { id } = useParams(), [m, setM] = useState(), [shows, setShows] = useState([]);
  useEffect(() => {
    api.get('/movies/' + id).then(r => setM(r.data)).catch(e => toast.error(errMsg(e)));
    api.get('/shows', { params: { movie: id } }).then(r => setShows(r.data));
  }, [id]);
  if (!m) return <p>Loading…</p>;
  return (
    <>
      <h2>{m.title}</h2><p>{m.genre} · {m.language} · {m.duration} min</p><p>{m.description}</p>
      <h5 className="mt-4">Showtimes</h5>
      {!shows.length && <p>No upcoming shows yet.</p>}
      {shows.map(s => (
        <div key={s._id} className="card p-3 mb-2 flex-row justify-content-between align-items-center">
          <span>{s.theatre.name}, {s.theatre.city} — {fmt(s.startTime)} — ₹{s.price}</span>
          <Link className="btn btn-warning btn-sm" to={'/book/' + s._id}>Select seats</Link>
        </div>))}
    </>
  );
}

export function Booking() {
  const { id } = useParams(), nav = useNavigate(), [show, setShow] = useState(), [sel, setSel] = useState([]);
  const load = () => api.get('/shows/' + id).then(r => setShow(r.data));
  useEffect(() => {
    load();
    const s = io(); s.emit('join', id);
    s.on('seats', b => { setShow(p => p && { ...p, bookedSeats: b }); setSel(x => x.filter(k => !b.includes(k))); });
    return () => s.disconnect();
  }, [id]);
  if (!show) return <p>Loading…</p>;
  const toggle = k => setSel(s => s.includes(k) ? s.filter(x => x !== k) : s.length < 8 ? [...s, k] : (toast.info('Maximum 8 seats'), s));
  const pay = async () => {
    try { await api.post('/bookings', { show: id, seats: sel }); toast.success('Payment successful. Booking confirmed!'); nav('/bookings'); }
    catch (e) { toast.error(errMsg(e)); load(); setSel([]); }
  };
  return (
    <>
      <h3>{show.movie.title}</h3><p>{show.theatre.name} — {fmt(show.startTime)} — ₹{show.price} per seat</p>
      <div className="screen" /><div className="text-center">
        {Array.from({ length: show.rows }, (_, i) => (
          <div key={i}>{Array.from({ length: show.cols }, (_, j) => {
            const k = String.fromCharCode(65 + i) + (j + 1);
            return <button key={k} className={'seat' + (sel.includes(k) ? ' sel' : '')} disabled={show.bookedSeats.includes(k)} onClick={() => toggle(k)}>{k}</button>;
          })}</div>))}
      </div>
      <div className="text-center mt-4">
        <p>{sel.length ? `${sel.join(', ')} — Total ₹${sel.length * show.price}` : 'Tap seats to select them'}</p>
        <button className="btn btn-warning" disabled={!sel.length} onClick={pay}>Pay ₹{sel.length * show.price}</button>
      </div>
    </>
  );
}

export function MyBookings() {
  const [list, setList] = useState([]);
  const load = () => api.get('/bookings/mine').then(r => setList(r.data)).catch(e => toast.error(errMsg(e)));
  useEffect(() => { load(); }, []);
  const cancel = async id => { try { await api.put(`/bookings/${id}/cancel`); toast.success('Booking cancelled'); load(); } catch (e) { toast.error(errMsg(e)); } };
  const now = new Date();
  return (
    <>
      <h3>My bookings</h3>{!list.length && <p>No bookings yet. Pick a movie to get started.</p>}
      {list.map(b => (
        <div key={b._id} className="card p-3 mb-2 flex-row justify-content-between align-items-center">
          <div><strong>{b.show.movie.title}</strong><br />{b.show.theatre.name} — {fmt(b.show.startTime)}<br />
            Seats {b.seats.join(', ')} · ₹{b.amount} · {b.status === 'cancelled' ? 'Cancelled' : new Date(b.show.startTime) > now ? 'Upcoming' : 'Past'}</div>
          {b.status === 'confirmed' && new Date(b.show.startTime) > now && <button className="btn btn-outline-danger btn-sm" onClick={() => cancel(b._id)}>Cancel booking</button>}
        </div>))}
    </>
  );
}

function Form({ title, fields, onSubmit }) {
  const [v, setV] = useState({});
  return (
    <form className="card p-3 mb-3" onSubmit={async e => { e.preventDefault(); if (await onSubmit(v)) setV({}); }}>
      <h5>{title}</h5>
      {fields.map(([k, label, type = 'text', opts]) => opts
        ? <select key={k} className="form-select mb-2" required value={v[k] || ''} onChange={e => setV({ ...v, [k]: e.target.value })}>
            <option value="">{label}</option>{opts.map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>
        : <input key={k} className="form-control mb-2" type={type} placeholder={label} required={k === 'title' || k === 'name' || type !== 'text'}
            value={v[k] || ''} onChange={e => setV({ ...v, [k]: e.target.value })} />)}
      <button className="btn btn-warning">Save</button>
    </form>
  );
}

export function Admin() {
  const [movies, setMovies] = useState([]), [theatres, setTheatres] = useState([]);
  const load = () => { api.get('/movies', { params: { limit: 100 } }).then(r => setMovies(r.data.items)); api.get('/shows/theatres').then(r => setTheatres(r.data)); };
  useEffect(() => { load(); }, []);
  const save = (url, msg) => async body => { try { await api.post(url, body); toast.success(msg); load(); return true; } catch (e) { toast.error(errMsg(e)); } };
  const del = async id => { await api.delete('/movies/' + id); toast.success('Movie deleted'); load(); };
  return (
    <div className="row">
      <div className="col-md-4"><Form title="Add movie" onSubmit={save('/movies', 'Movie added')}
        fields={[['title', 'Title'], ['genre', 'Genre'], ['language', 'Language'], ['duration', 'Duration (min)', 'number'], ['description', 'Description']]} />
        <Form title="Add theatre" onSubmit={save('/shows/theatres', 'Theatre added')} fields={[['name', 'Theatre name'], ['city', 'City']]} /></div>
      <div className="col-md-4"><Form title="Add show" onSubmit={save('/shows', 'Show added')}
        fields={[['movie', 'Select movie', 'text', movies.map(m => [m._id, m.title])], ['theatre', 'Select theatre', 'text', theatres.map(t => [t._id, t.name])],
          ['startTime', 'Start time', 'datetime-local'], ['price', 'Price (₹)', 'number']]} /></div>
      <div className="col-md-4"><h5>Movies</h5>{movies.map(m => (
        <div key={m._id} className="d-flex justify-content-between mb-1"><span>{m.title}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={() => del(m._id)}>Delete</button></div>))}</div>
    </div>
  );
}
