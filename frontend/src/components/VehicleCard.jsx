export default function VehicleCard({ vehicle }) {
  const isAvailable = vehicle.availability_status === 'available';
  return (
    <div style={styles.card}>
      <div style={styles.imageWrap}>
        <img src={vehicle.image_url} alt={vehicle.name} style={styles.image} />
        <span style={{ ...styles.statusTag, background: isAvailable ? '#1E8E5A' : '#C0392B' }}>
          {isAvailable ? 'Available' : 'Unavailable'}
        </span>
      </div>
      <div style={styles.body}>
        <span style={styles.type}>{vehicle.vehicle_type}</span>
        <h3 style={styles.name}>{vehicle.brand} {vehicle.name}</h3>
        <div style={styles.meta}>
          <span>🧑‍🤝‍🧑 {vehicle.seats} seats</span>
          <span style={styles.price}>NPR {vehicle.price_per_km}/km</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(11,31,58,0.08)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  imageWrap: { position: 'relative', height: 190, background: '#eee' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  statusTag: {
    position: 'absolute', top: 12, right: 12, color: '#fff',
    fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px', borderRadius: 20,
  },
  body: { padding: '18px 20px 22px' },
  type: { color: '#C9A24B', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' },
  name: { fontSize: '1.15rem', margin: '6px 0 12px' },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: '0.88rem' },
  price: { color: '#0B1F3A', fontWeight: 700 },
};
