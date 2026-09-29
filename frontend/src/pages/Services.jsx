import { Link } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard.jsx';
import { useAuth } from '../AuthContext.jsx';

const SERVICES = [
  { icon: '✈️', title: 'Airport Transfers', description: 'Reliable pickups and drop-offs timed around your flight schedule.' },
  { icon: '🏙️', title: 'City Rides', description: 'Point-to-point travel across town in comfort, any time of day.' },
  { icon: '💼', title: 'Business Travel', description: 'Polished chauffeur service for meetings, roadshows, and client visits.' },
  { icon: '🏢', title: 'Corporate Mobility', description: 'Dependable mobility programs designed for teams and organizations.' },
  { icon: '🛣️', title: 'Outstation Trips', description: 'Comfortable long-distance travel between cities with experienced drivers.' },
  { icon: '⏳', title: 'Hourly Rentals', description: 'Book a vehicle and driver by the hour for multi-stop errands or events.' },
  { icon: '🎉', title: 'Events & Special Occasions', description: 'Arrive in style for weddings, galas, and celebrations that matter.' },
  { icon: '🎩', title: 'Premium Chauffeur Services', description: 'A dedicated, professionally trained chauffeur for your day.' },
];

export default function Services() {
  const { user } = useAuth();
  return (
    <div className="section">
      <div className="container">
        <h2 className="section-title">Our Services</h2>
        <p className="section-subtitle">Every OneCar service is backed by the same standard: premium vehicles, vetted drivers, and dependable timing.</p>
        <div style={styles.grid}>
          {SERVICES.map((s) => <ServiceCard key={s.title} {...s} />)}
        </div>
        <div style={styles.cta}>
          <div>
            <h3 style={{ marginBottom: 6 }}>Ready to book?</h3>
            <p style={{ color: '#6B7280' }}>Choose a service during checkout — the booking form covers all of them.</p>
          </div>
          <Link to={user ? '/booking' : '/register'} className="btn btn-primary">Book Now</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: 24,
    marginBottom: 48,
  },
  cta: {
    background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 8px 24px rgba(11,31,58,0.08)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
  },
};
