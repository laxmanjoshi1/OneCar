import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingForm from '../components/BookingForm.jsx';
import { getVehicles, createBooking } from '../services/api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Booking() {
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getVehicles()
      .then((res) => { if (res.success) setVehicles(res.data); })
      .catch(() => setError('Could not load vehicles. Please check the backend is running.'))
      .finally(() => setLoadingVehicles(false));
  }, []);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await createBooking(formData);
      if (res.success) {
        setConfirmation({ ...formData, booking_id: res.data.booking_id });
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Booking failed. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="section">
        <div className="container" style={{ maxWidth: 560 }}>
          <div style={styles.confirmCard}>
            <div style={styles.checkIcon}>✓</div>
            <h2 style={{ marginBottom: 8 }}>Booking Confirmed!</h2>
            <p style={{ color: '#6B7280', marginBottom: 24 }}>
              Your booking reference is <strong>#{confirmation.booking_id}</strong>. Our team will confirm your driver shortly.
            </p>
            <div style={styles.summary}>
              <SummaryRow label="Pickup" value={confirmation.pickup_location} />
              <SummaryRow label="Destination" value={confirmation.destination} />
              <SummaryRow label="Date & Time" value={`${confirmation.booking_date} at ${confirmation.booking_time}`} />
              <SummaryRow label="Passengers" value={confirmation.passengers} />
              <SummaryRow label="Status" value="Pending" />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
              <button className="btn btn-outline-navy" onClick={() => setConfirmation(null)}>Book Another Ride</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 640 }}>
        <h2 className="section-title">Book Your Premium Ride</h2>
        <p className="section-subtitle">Fill in the details below and we'll take care of the rest.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <div style={styles.formCard}>
          {loadingVehicles ? (
            <p>Loading available vehicles...</p>
          ) : (
            <BookingForm vehicles={vehicles} onSubmit={handleSubmit} submitting={submitting} initialContactPhone={user?.phone || ''} />
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>
      <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{value}</span>
    </div>
  );
}

const styles = {
  formCard: { background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 8px 24px rgba(11,31,58,0.1)' },
  confirmCard: { background: '#fff', borderRadius: 14, padding: 40, boxShadow: '0 8px 24px rgba(11,31,58,0.1)', textAlign: 'center' },
  checkIcon: {
    width: 60, height: 60, borderRadius: '50%', background: '#D1FAE5', color: '#065F46',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
    margin: '0 auto 20px',
  },
  summary: { textAlign: 'left', marginTop: 12 },
};
