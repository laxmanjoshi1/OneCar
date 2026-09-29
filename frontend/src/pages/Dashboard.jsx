import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { getMyBookings, cancelBooking } from '../services/api.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const loadBookings = () => {
    setLoading(true);
    getMyBookings()
      .then((res) => { if (res.success) setBookings(res.data); else setError(res.message); })
      .catch(() => setError('Could not load bookings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBookings(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancellingId(id);
    try {
      const res = await cancelBooking(id);
      if (res.success) loadBookings();
      else alert(res.message);
    } catch (e) {
      alert('Could not cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const upcoming = bookings.filter((b) => ['pending', 'confirmed'].includes(b.status));
  const past = bookings.filter((b) => ['completed', 'cancelled'].includes(b.status));

  return (
    <div className="section">
      <div className="container">
        <div style={styles.profileCard}>
          <div>
            <h2 style={{ marginBottom: 6 }}>Welcome, {user?.full_name}</h2>
            <p style={{ color: '#6B7280' }}>{user?.email} · {user?.phone}</p>
          </div>
          <Link to="/booking" className="btn btn-primary">+ New Booking</Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <h3 style={{ margin: '32px 0 16px' }}>Upcoming Bookings</h3>
        {loading ? <p>Loading...</p> : upcoming.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={styles.list}>
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} onCancel={handleCancel} cancelling={cancellingId === b.id} />
            ))}
          </div>
        )}

        <h3 style={{ margin: '40px 0 16px' }}>Previous Bookings</h3>
        {!loading && past.length === 0 ? (
          <p style={{ color: '#6B7280' }}>No past bookings yet.</p>
        ) : (
          <div style={styles.list}>
            {past.map((b) => <BookingCard key={b.id} booking={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 32, textAlign: 'center', color: '#6B7280' }}>
      No upcoming bookings. <Link to="/booking" style={{ color: '#0B1F3A', fontWeight: 600 }}>Book a ride now →</Link>
    </div>
  );
}

function BookingCard({ booking, onCancel, cancelling }) {
  const badgeClass = `badge badge-${booking.status}`;
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <strong>{booking.pickup_location} → {booking.destination}</strong>
          <p style={{ color: '#6B7280', fontSize: '0.88rem', marginTop: 4 }}>
            {booking.booking_date} at {booking.booking_time} · {booking.passengers} passenger(s)
          </p>
        </div>
        <span className={badgeClass}>{booking.status}</span>
      </div>
      <div style={styles.cardBody}>
        <span>🚘 {booking.brand} {booking.vehicle_name} ({booking.vehicle_type})</span>
        {booking.driver_name && <span>👤 Driver: {booking.driver_name} · {booking.driver_phone}</span>}
        {booking.special_request && <span>📝 {booking.special_request}</span>}
      </div>
      {onCancel && booking.status === 'pending' && (
        <button className="btn btn-outline-navy" style={{ marginTop: 12, fontSize: '0.85rem', padding: '8px 16px' }}
                onClick={() => onCancel(booking.id)} disabled={cancelling}>
          {cancelling ? 'Cancelling...' : 'Cancel Booking'}
        </button>
      )}
    </div>
  );
}

const styles = {
  profileCard: {
    background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 8px 24px rgba(11,31,58,0.08)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 14 },
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 10px rgba(11,31,58,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 },
  cardBody: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14, color: '#374151', fontSize: '0.88rem' },
};
