import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginAdmin } from '../services/api.js';
import { useAuth } from '../AuthContext.jsx';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setIsAdmin, setUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginAdmin(form);
      if (res.success) {
        setIsAdmin(true);
        setUser(null);
        navigate('/admin/dashboard');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Unable to reach the server. Is the PHP backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 420 }}>
        <div style={styles.card}>
          <span style={styles.badge}>ADMIN PANEL</span>
          <h2 style={{ margin: '10px 0 6px' }}>Admin Login</h2>
          <p style={{ color: '#6B7280', marginBottom: 24 }}>Sign in to manage OneCar operations.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={styles.label}>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} style={styles.input} placeholder="admin@onecar.com" />
            </div>
            <div>
              <label style={styles.label}>Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} style={styles.input} placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Login as Admin'}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: '0.85rem' }}>
            <Link to="/login" style={{ color: '#6B7280' }}>← Back to customer login</Link>
          </p>
          <p style={{ marginTop: 12, fontSize: '0.8rem', color: '#9CA3AF' }}>
            Demo credentials: admin@onecar.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#fff', borderRadius: 14, padding: 36, boxShadow: '0 8px 24px rgba(11,31,58,0.1)' },
  badge: {
    display: 'inline-block', background: '#0B1F3A', color: '#E4C97E', fontSize: '0.7rem',
    fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.5px',
  },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 },
  input: { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: '0.95rem' },
};
