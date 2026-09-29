import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Hero() {
  const { user } = useAuth();

  return (
    <section style={styles.hero}>
      <div className="container" style={styles.inner}>
        <span style={styles.eyebrow}>PREMIUM MOBILITY, REDEFINED</span>
        <h1 style={styles.title}>Your Journey, Chauffeured with Distinction</h1>
        <p style={styles.subtitle}>
          OneCar connects you with professional drivers and premium vehicles for airport transfers,
          business travel, and every occasion that deserves more than an ordinary ride.
        </p>
        <div style={styles.ctaRow}>
          <Link to={user ? '/booking' : '/register'} className="btn btn-primary" style={{ padding: '15px 32px' }}>
            Book a Premium Ride
          </Link>
          <Link to="/services" className="btn btn-secondary" style={{ padding: '15px 32px' }}>
            Explore Services
          </Link>
        </div>
        <div style={styles.stats}>
          <div style={styles.stat}>
            <strong style={styles.statNum}>500+</strong>
            <span style={styles.statLabel}>Rides Completed</span>
          </div>
          <div style={styles.stat}>
            <strong style={styles.statNum}>4.9★</strong>
            <span style={styles.statLabel}>Average Rating</span>
          </div>
          <div style={styles.stat}>
            <strong style={styles.statNum}>24/7</strong>
            <span style={styles.statLabel}>Availability</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles = {
  hero: {
    background: 'linear-gradient(135deg, #0B1F3A 0%, #14294d 60%, #1a3050 100%)',
    color: '#fff',
    padding: '110px 0 90px',
  },
  inner: {
    maxWidth: 720,
  },
  eyebrow: {
    color: '#E4C97E',
    fontWeight: 600,
    fontSize: '0.85rem',
    letterSpacing: '1.5px',
  },
  title: {
    color: '#fff',
    fontSize: '3rem',
    margin: '18px 0 20px',
    fontWeight: 700,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: '1.1rem',
    marginBottom: 36,
    maxWidth: 600,
  },
  ctaRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 56,
  },
  stats: {
    display: 'flex',
    gap: 48,
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statNum: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '1.6rem',
    color: '#E4C97E',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: '0.85rem',
  },
};
