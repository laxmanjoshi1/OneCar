import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api.js';
import { useAuth } from '../AuthContext.jsx';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setIsAdmin } = useAuth();
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
      const res = await loginUser(form);
      if (res.success) {
        setUser(res.data);
        setIsAdmin(false);
        navigate('/dashboard');
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
      <div className="container" style={{ maxWidth: 440 }}>
        <div style={styles.card}>
          <h2 style={{ marginBottom: 6 }}>Welcome Back</h2>
          <p style={{ color: '#6B7280', marginBottom: 24 }}>Log in to book and manage your rides.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={styles.label}>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} style={styles.input} placeholder="you@example.com" />
            </div>
            <div>
              <label style={styles.label}>Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} style={styles.input} placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Login'}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: '0.9rem', color: '#6B7280' }}>
            Don't have an account? <Link to="/register" style={{ color: '#0B1F3A', fontWeight: 600 }}>Register here</Link>
          </p>
          <p style={{ marginTop: 8, fontSize: '0.85rem' }}>
            <Link to="/admin/login" style={{ color: '#C9A24B' }}>Admin Login →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#fff', borderRadius: 14, padding: 36, boxShadow: '0 8px 24px rgba(11,31,58,0.1)' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 },
  input: { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: '0.95rem' },
};
