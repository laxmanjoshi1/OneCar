import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import VehicleCard from '../components/VehicleCard.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import { getVehicles } from '../services/api.js';

const SERVICES = [
  { icon: '✈️', title: 'Airport Transfers', description: 'Punctual pickups and drop-offs with flight tracking consideration.' },
  { icon: '🏙️', title: 'City Rides', description: 'Comfortable point-to-point travel across the city, day or night.' },
  { icon: '💼', title: 'Business Travel', description: 'Professional chauffeurs for meetings, roadshows, and client visits.' },
  { icon: '🏢', title: 'Corporate Mobility', description: 'Reliable ride programs tailored for teams and organizations.' },
];

const WHY_CHOOSE = [
  { icon: '🛡️', title: 'Vetted Drivers', description: 'Every chauffeur is background-checked and professionally trained.' },
  { icon: '⭐', title: 'Premium Fleet', description: 'A curated selection of premium sedans and SUVs, always well maintained.' },
  { icon: '⏱️', title: 'Always On Time', description: 'We plan routes and schedules to keep you ahead of the clock.' },
  { icon: '💬', title: 'Dedicated Support', description: 'Real people ready to help before, during, and after your ride.' },
];

export default function Home() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVehicles()
      .then((res) => { if (res.success) setVehicles(res.data.slice(0, 4)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Hero />

      {/* Services Section */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Our Premium Services</h2>
          <p className="section-subtitle">Whatever the occasion, OneCar has a service designed around it.</p>
          <div style={gridStyles.services}>
            {SERVICES.map((s) => <ServiceCard key={s.title} {...s} />)}
          </div>
          <div style={{ marginTop: 32 }}>
            <Link to="/services" className="btn btn-outline-navy">View All Services</Link>
          </div>
        </div>
      </section>

      {/* Popular Vehicles Section */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <h2 className="section-title">Popular Premium Vehicles</h2>
          <p className="section-subtitle">A glimpse of the fleet available for your next ride.</p>
          {loading ? (
            <p>Loading vehicles...</p>
          ) : (
            <div style={gridStyles.vehicles}>
              {vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Why Choose OneCar</h2>
          <p className="section-subtitle">The details that make every ride feel effortless.</p>
          <div style={gridStyles.services}>
            {WHY_CHOOSE.map((s) => <ServiceCard key={s.title} {...s} />)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={ctaStyles.wrap}>
        <div className="container" style={ctaStyles.inner}>
          <div>
            <h2 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: 8 }}>Ready for your next premium ride?</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>Create an account and book in under two minutes.</p>
          </div>
          <Link to="/register" className="btn btn-primary" style={{ padding: '14px 30px', whiteSpace: 'nowrap' }}>
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}

const gridStyles = {
  services: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: 24,
  },
  vehicles: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 24,
  },
};

const ctaStyles = {
  wrap: { background: '#0B1F3A', padding: '50px 0' },
  inner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 20,
  },
};
