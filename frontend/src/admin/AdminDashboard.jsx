import { useEffect, useState } from 'react';
import {
  getAdminDashboard, getAdminBookings, getAdminUsers,
  getAdminDrivers, getAdminVehicles, getAdminMessages, updateBookingStatus,
} from '../services/api.js';

const TABS = ['Overview', 'Bookings', 'Users', 'Drivers', 'Vehicles', 'Messages'];
const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, bookingsRes, usersRes, driversRes, vehiclesRes, messagesRes] = await Promise.all([
        getAdminDashboard(), getAdminBookings(), getAdminUsers(), getAdminDrivers(), getAdminVehicles(), getAdminMessages(),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (bookingsRes.success) setBookings(bookingsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (driversRes.success) setDrivers(driversRes.data);
      if (vehiclesRes.success) setVehicles(vehiclesRes.data);
      if (messagesRes.success) setMessages(messagesRes.data);
    } catch (e) {
      setError('Could not load admin data. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const res = await updateBookingStatus(bookingId, newStatus);
      if (res.success) {
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)));
      } else {
        alert(res.message);
      }
    } catch (e) {
      alert('Could not update booking status.');
    }
  };

  return (
    <div className="section">
      <div className="container">
        <h2 className="section-title">Admin Dashboard</h2>
        <p className="section-subtitle">Manage bookings, users, drivers, and vehicles across OneCar.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <div style={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ ...styles.tabBtn, ...(activeTab === tab ? styles.tabBtnActive : {}) }}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? <p>Loading admin data...</p> : (
          <>
            {activeTab === 'Overview' && stats && <OverviewTab stats={stats} />}
            {activeTab === 'Bookings' && <BookingsTab bookings={bookings} onStatusChange={handleStatusChange} />}
            {activeTab === 'Users' && <UsersTab users={users} />}
            {activeTab === 'Drivers' && <DriversTab drivers={drivers} />}
            {activeTab === 'Vehicles' && <VehiclesTab vehicles={vehicles} />}
            {activeTab === 'Messages' && <MessagesTab messages={messages} />}
          </>
        )}
      </div>
    </div>
  );
}

function OverviewTab({ stats }) {
  const cards = [
    { label: 'Total Users', value: stats.total_users, color: '#0B1F3A' },
    { label: 'Total Bookings', value: stats.total_bookings, color: '#0B1F3A' },
    { label: 'Pending', value: stats.pending_bookings, color: '#B8860B' },
    { label: 'Confirmed', value: stats.confirmed_bookings, color: '#1E40AF' },
    { label: 'Completed', value: stats.completed_bookings, color: '#065F46' },
    { label: 'Cancelled', value: stats.cancelled_bookings, color: '#991B1B' },
    { label: 'Total Vehicles', value: stats.total_vehicles, color: '#0B1F3A' },
    { label: 'Total Drivers', value: stats.total_drivers, color: '#0B1F3A' },
    { label: 'Contact Messages', value: stats.contact_messages, color: '#0B1F3A' },
  ];
  return (
    <div style={styles.statsGrid}>
      {cards.map((c) => (
        <div key={c.label} style={styles.statCard}>
          <span style={{ ...styles.statValue, color: c.color }}>{c.value}</span>
          <span style={styles.statLabel}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

function BookingsTab({ bookings, onStatusChange }) {
  if (bookings.length === 0) return <p style={{ color: '#6B7280' }}>No bookings yet.</p>;
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <Th>ID</Th><Th>Customer</Th><Th>Route</Th><Th>Date/Time</Th><Th>Vehicle</Th><Th>Status</Th><Th>Update</Th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <Td>#{b.id}</Td>
              <Td>{b.customer_name}<br /><small style={{ color: '#9CA3AF' }}>{b.customer_email}</small></Td>
              <Td>{b.pickup_location} → {b.destination}</Td>
              <Td>{b.booking_date}<br />{b.booking_time}</Td>
              <Td>{b.vehicle_name}<br /><small style={{ color: '#9CA3AF' }}>{b.vehicle_type}</small></Td>
              <Td><span className={`badge badge-${b.status}`}>{b.status}</span></Td>
              <Td>
                <select value={b.status} onChange={(e) => onStatusChange(b.id, e.target.value)} style={styles.select}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersTab({ users }) {
  if (users.length === 0) return <p style={{ color: '#6B7280' }}>No users yet.</p>;
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead><tr><Th>ID</Th><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Bookings</Th><Th>Joined</Th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <Td>#{u.id}</Td><Td>{u.full_name}</Td><Td>{u.email}</Td><Td>{u.phone}</Td>
              <Td>{u.total_bookings}</Td><Td>{new Date(u.created_at).toLocaleDateString()}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DriversTab({ drivers }) {
  if (drivers.length === 0) return <p style={{ color: '#6B7280' }}>No drivers yet.</p>;
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead><tr><Th>ID</Th><Th>Name</Th><Th>Phone</Th><Th>License</Th><Th>Vehicle</Th><Th>Status</Th></tr></thead>
        <tbody>
          {drivers.map((d) => (
            <tr key={d.id}>
              <Td>#{d.id}</Td><Td>{d.name}</Td><Td>{d.phone}</Td><Td>{d.license_number}</Td>
              <Td>{d.vehicle_name || '—'}</Td>
              <Td><span className={`badge ${d.availability_status === 'available' ? 'badge-completed' : d.availability_status === 'on_trip' ? 'badge-pending' : 'badge-cancelled'}`}>{d.availability_status}</span></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VehiclesTab({ vehicles }) {
  if (vehicles.length === 0) return <p style={{ color: '#6B7280' }}>No vehicles yet.</p>;
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead><tr><Th>ID</Th><Th>Vehicle</Th><Th>Type</Th><Th>Seats</Th><Th>Rate/km</Th><Th>Status</Th></tr></thead>
        <tbody>
          {vehicles.map((v) => (
            <tr key={v.id}>
              <Td>#{v.id}</Td><Td>{v.brand} {v.name}</Td><Td>{v.vehicle_type}</Td><Td>{v.seats}</Td>
              <Td>NPR {v.price_per_km}</Td>
              <Td><span className={`badge ${v.availability_status === 'available' ? 'badge-completed' : 'badge-cancelled'}`}>{v.availability_status}</span></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MessagesTab({ messages }) {
  if (messages.length === 0) return <p style={{ color: '#6B7280' }}>No messages yet.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {messages.map((m) => (
        <div key={m.id} style={styles.msgCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{m.name}</strong>
            <small style={{ color: '#9CA3AF' }}>{new Date(m.created_at).toLocaleString()}</small>
          </div>
          <small style={{ color: '#6B7280' }}>{m.email} {m.phone && `· ${m.phone}`}</small>
          <p style={{ marginTop: 8 }}>{m.message}</p>
        </div>
      ))}
    </div>
  );
}

function Th({ children }) { return <th style={styles.th}>{children}</th>; }
function Td({ children }) { return <td style={styles.td}>{children}</td>; }

const styles = {
  tabs: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28, borderBottom: '1.5px solid #E5E7EB', paddingBottom: 12 },
  tabBtn: { padding: '9px 18px', borderRadius: 8, background: 'transparent', color: '#6B7280', fontWeight: 600, fontSize: '0.88rem' },
  tabBtnActive: { background: '#0B1F3A', color: '#fff' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18 },
  statCard: { background: '#fff', borderRadius: 12, padding: '24px 20px', boxShadow: '0 4px 16px rgba(11,31,58,0.06)', display: 'flex', flexDirection: 'column', gap: 8 },
  statValue: { fontSize: '2rem', fontWeight: 700, fontFamily: "'Poppins', sans-serif" },
  statLabel: { color: '#6B7280', fontSize: '0.85rem' },
  tableWrap: { background: '#fff', borderRadius: 12, overflow: 'auto', boxShadow: '0 4px 16px rgba(11,31,58,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 720 },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: '0.78rem', textTransform: 'uppercase', color: '#6B7280', borderBottom: '1.5px solid #E5E7EB', whiteSpace: 'nowrap' },
  td: { padding: '14px 16px', fontSize: '0.88rem', borderBottom: '1px solid #F3F4F6', verticalAlign: 'top' },
  select: { padding: '6px 10px', borderRadius: 6, border: '1.5px solid #E5E7EB', fontSize: '0.82rem' },
  msgCard: { background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 2px 10px rgba(11,31,58,0.06)' },
};
