import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api.js';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.full_name || !form.email || !form.phone || !form.password) return 'All fields are required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirm_password) return 'Passwords do not match.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const res = await registerUser({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      if (res.success) {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
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
      <div className="container" style={{ maxWidth: 460 }}>
        <div style={styles.card}>
          <h2 style={{ marginBottom: 6 }}>Create Your Account</h2>
          <p style={{ color: '#6B7280', marginBottom: 24 }}>Join OneCar for premium, reliable rides.</p>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={styles.label}>Full Name</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} style={styles.input} placeholder="Your full name" />
            </div>
            <div>
              <label style={styles.label}>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} style={styles.input} placeholder="you@example.com" />
            </div>
            <div>
              <label style={styles.label}>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} style={styles.input} placeholder="98XXXXXXXX" />
            </div>
            <div>
              <label style={styles.label}>Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} style={styles.input} placeholder="At least 6 characters" />
            </div>
            <div>
              <label style={styles.label}>Confirm Password</label>
              <input type="password" name="confirm_password" value={form.confirm_password} onChange={handleChange} style={styles.input} placeholder="Re-enter password" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Register'}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: '0.9rem', color: '#6B7280' }}>
            Already have an account? <Link to="/login" style={{ color: '#0B1F3A', fontWeight: 600 }}>Login here</Link>
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
