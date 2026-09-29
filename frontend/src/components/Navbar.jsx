import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { logoutUser } from '../services/api.js';

export default function Navbar() {
  const { user, isAdmin, setUser, setIsAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) { /* ignore */ }
    setUser(null);
    setIsAdmin(false);
    navigate('/');
  };

  return (
    <header style={styles.header}>
      <div className="container" style={styles.inner}>
        <Link to="/" style={styles.logo}>
          One<span style={{ color: '#C9A24B' }}>Car</span>
        </Link>

        <nav style={styles.nav} className={menuOpen ? 'mobile-open' : ''}>
          <Link to="/" style={styles.link} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/services" style={styles.link} onClick={() => setMenuOpen(false)}>Services</Link>
          <Link to="/contact" style={styles.link} onClick={() => setMenuOpen(false)}>Contact</Link>
          {user && <Link to="/dashboard" style={styles.link} onClick={() => setMenuOpen(false)}>Dashboard</Link>}

          <div style={styles.authArea}>
            {!user && !isAdmin && (
              <>
                <Link to="/login" className="btn btn-outline-navy" style={styles.navBtn} onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="btn btn-primary" style={styles.navBtn} onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
            {(user || isAdmin) && (
              <button className="btn btn-outline-navy" style={styles.navBtn} onClick={handleLogout}>Logout</button>
            )}
          </div>
        </nav>

        <button style={styles.burger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          ☰
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: '#fff',
    boxShadow: '0 2px 12px rgba(11,31,58,0.06)',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 72,
  },
  logo: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800,
    fontSize: '1.5rem',
    color: '#0B1F3A',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 28,
  },
  navOpen: {},
  link: {
    fontWeight: 500,
    fontSize: '0.95rem',
    color: '#0B1F3A',
  },
  authArea: {
    display: 'flex',
    gap: 10,
  },
  navBtn: {
    padding: '9px 18px',
    fontSize: '0.88rem',
  },
  burger: {
    display: 'none',
    background: 'none',
    fontSize: '1.5rem',
    color: '#0B1F3A',
  },
};

// Simple responsive behavior via injected stylesheet (keeps component single-file)
const styleTag = document.createElement('style');
styleTag.innerHTML = `
@media (max-width: 860px) {
  header nav { display: none !important; }
  header nav.mobile-open { 
    display: flex !important; 
    position: absolute; 
    top: 72px; left: 0; right: 0; 
    background: #fff; 
    flex-direction: column; 
    padding: 20px 24px; 
    box-shadow: 0 8px 24px rgba(11,31,58,0.12); 
  }
  header button[aria-label="Toggle menu"] { display: block !important; }
}
`;
if (!document.getElementById('navbar-responsive-style')) {
  styleTag.id = 'navbar-responsive-style';
  document.head.appendChild(styleTag);
}
