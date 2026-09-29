import { useState } from 'react';
import { submitContact } from '../services/api.js';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name || !form.email || !form.message) {
      setError('Name, email, and message are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await submitContact(form);
      if (res.success) {
        setSuccess(res.message);
        setForm({ name: '', email: '', phone: '', message: '' });
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Could not send message. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 560 }}>
        <h2 className="section-title">Get in Touch</h2>
        <p className="section-subtitle">Questions about corporate mobility, events, or anything else? We'd love to hear from you.</p>

        <div style={styles.card}>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={styles.label}>Name</label>
              <input name="name" value={form.name} onChange={handleChange} style={styles.input} placeholder="Your name" />
            </div>
            <div>
              <label style={styles.label}>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} style={styles.input} placeholder="you@example.com" />
            </div>
            <div>
              <label style={styles.label}>Phone (optional)</label>
              <input name="phone" value={form.phone} onChange={handleChange} style={styles.input} placeholder="98XXXXXXXX" />
            </div>
            <div>
              <label style={styles.label}>Message</label>
              <textarea name="message" value={form.message} onChange={handleChange} rows={5} style={{ ...styles.input, resize: 'vertical' }} placeholder="How can we help?" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 8px 24px rgba(11,31,58,0.1)' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 },
  input: { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif' },
};
