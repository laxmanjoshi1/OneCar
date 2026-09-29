export default function ServiceCard({ icon, title, description }) {
  return (
    <div style={styles.card}>
      <div style={styles.iconWrap}>{icon}</div>
      <h3 style={styles.title}>{title}</h3>
      <p style={styles.desc}>{description}</p>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 14,
    padding: '30px 26px',
    boxShadow: '0 4px 16px rgba(11,31,58,0.06)',
    height: '100%',
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 12,
    background: 'linear-gradient(135deg, #0B1F3A, #1a3050)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.4rem', marginBottom: 18,
  },
  title: { fontSize: '1.1rem', marginBottom: 10 },
  desc: { color: '#6B7280', fontSize: '0.92rem' },
};
