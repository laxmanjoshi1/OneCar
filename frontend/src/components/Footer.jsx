import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="container" style={styles.grid}>
        <div>
          <h3 style={styles.logo}>One<span style={{ color: '#C9A24B' }}>Car</span></h3>
          <p style={styles.text}>Premium mobility, on your terms. Reliable chauffeur-driven rides for every occasion.</p>
        </div>
        <div>
          <h4 style={styles.heading}>Company</h4>
          <Link to="/" style={styles.link}>Home</Link>
          <Link to="/services" style={styles.link}>Services</Link>
          <Link to="/contact" style={styles.link}>Contact</Link>
        </div>
        <div>
          <h4 style={styles.heading}>Services</h4>
          <span style={styles.text}>Airport Transfers</span>
          <span style={styles.text}>Corporate Mobility</span>
          <span style={styles.text}>Outstation Trips</span>
        </div>
        <div>
          <h4 style={styles.heading}>Contact</h4>
          <span style={styles.text}>support@onecar.com</span>
          <span style={styles.text}>+977 1-4000000</span>
          <span style={styles.text}>Kathmandu, Nepal</span>
        </div>
      </div>
      <div style={styles.bottom}>
        <div className="container">
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            © {new Date().getFullYear()} OneCar Premium Mobility. All rights reserved. (MVP Demo Project)
          </p>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: '#0B1F3A',
    color: '#fff',
    marginTop: 80,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 32,
    padding: '56px 24px 32px',
  },
  logo: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800,
    fontSize: '1.4rem',
    color: '#fff',
    marginBottom: 12,
  },
  heading: {
    color: '#fff',
    fontSize: '1rem',
    marginBottom: 14,
  },
  text: {
    display: 'block',
    color: 'rgba(255,255,255,0.65)',
    fontSize: '0.9rem',
    marginBottom: 10,
  },
  link: {
    display: 'block',
    color: 'rgba(255,255,255,0.65)',
    fontSize: '0.9rem',
    marginBottom: 10,
  },
  bottom: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    padding: '20px 0',
  },
};
