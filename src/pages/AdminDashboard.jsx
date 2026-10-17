import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";

const sections = [["Overview", "/admin"], ["Orders", "/admin/bookings"], ["Vehicles", "/admin/vehicles"], ["Commission", "/admin/commission"], ["Customers", "/admin/customers"]];
const CATEGORIES = ["Comfort Sedan", "Premium SUV", "Executive Class"];
const FUELS = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];

const inr = n => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const when = iso => iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "—";
const PAY_LABEL = { pending_cash: "Cash on ride", pending: "Awaiting payment", paid: "Paid", failed: "Failed", refund_due: "Refund due" };
const STATUS_LABEL = { pending: "Pending", confirmed: "Accepted", rejected: "Rejected", cancelled: "Cancelled", completed: "Completed" };

function OrdersTable({ rows, vehicles, onAction, empty = "No orders here yet." }) {
  const [pick, setPick] = useState({});
  if (!rows.length) return <p className="admin-empty">{empty}</p>;
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Reference</th><th>Customer</th><th>Journey</th><th>Pickup (IST)</th><th>Fare</th><th>Payment</th><th>Status</th><th>Vehicle</th>{onAction && <th>Action</th>}</tr></thead><tbody>
    {rows.map(r => {
      const options = (vehicles || []).filter(v => v.active && v.category === r.vehicle_category);
      return <tr key={r.id}>
        <td><b>{r.booking_reference}</b><br /><small>{r.ride_type} · {r.vehicle_category}</small></td>
        <td>{r.customer_name}<br /><small>{r.customer_phone}</small></td>
        <td style={{ whiteSpace: "normal", minWidth: 220 }}>{r.pickup_location} → {r.destination}<br /><small>{Number(r.distance_km).toFixed(1)} km · {r.duration_minutes} min</small></td>
        <td>{when(r.pickup_at)}</td>
        <td>{inr(r.total_fare)}</td>
        <td><span className={`admin-status ${r.payment_status === "paid" ? "completed" : r.payment_status === "refund_due" || r.payment_status === "failed" ? "cancelled" : "pending"}`}>{PAY_LABEL[r.payment_status] || r.payment_status}</span></td>
        <td><span className={`admin-status ${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span>{r.status_reason && <><br /><small title={r.status_reason}>{r.status_reason.slice(0, 40)}</small></>}</td>
        <td>{r.vehicle_name ? <>{r.vehicle_name}<br /><small>{r.vehicle_registration || ""}</small></> : "—"}</td>
        {onAction && <td><div className="admin-row-actions">
          {r.status === "pending" && <>
            {options.length > 1 && <select aria-label="Assign vehicle" value={pick[r.id] || ""} onChange={e => setPick({ ...pick, [r.id]: e.target.value })}><option value="">Auto-assign</option>{options.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>}
            <button className="admin-accept" onClick={() => onAction("accept", r, { vehicle_id: pick[r.id] || undefined })}>Accept</button>
            <button className="admin-reject" onClick={() => onAction("reject", r)}>Reject</button></>}
          {r.status === "confirmed" && <>
            <button className="admin-primary" onClick={() => onAction("complete", r)}>Mark completed</button>
            <button className="admin-secondary" onClick={() => onAction("cancel", r)}>Cancel</button></>}
        </div></td>}
      </tr>;
    })}
  </tbody></table></div>;
}

function useOrderActions(refresh, setMessage) {
  return async (action, row, extra = {}) => {
    setMessage(null);
    let body = { ...extra };
    if (action === "reject" || action === "cancel") {
      const reason = window.prompt(action === "reject" ? "Reason for rejecting this order (shown to the customer):" : "Reason for cancelling this accepted order:");
      if (reason === null) return;
      body.reason = reason;
    }
    if (action === "complete" && !window.confirm(`Mark ${row.booking_reference} as completed?${row.payment_method === "cash" ? " This records the cash as collected." : ""}`)) return;
    try { await api(`/admin/bookings/${row.id}/${action}`, { method: "POST", body: JSON.stringify(body) }); setMessage({ ok: true, text: `Order ${row.booking_reference}: ${{ accept: "accepted", reject: "rejected", complete: "completed", cancel: "cancelled" }[action]}.` }); await refresh(); }
    catch (e) { setMessage({ ok: false, text: e.message }); }
  };
}
const Flash = ({ m }) => m ? <div className={m.ok ? "admin-success" : "admin-error"} role="status">{m.text}</div> : null;

function Overview({ stats, bookings, vehicles, refresh }) {
  const [message, setMessage] = useState(null);
  const act = useOrderActions(refresh, setMessage);
  const cards = [
    ["Orders awaiting decision", stats.pending_bookings ?? "—"], ["Accepted (upcoming)", stats.confirmed_bookings ?? "—"], ["Completed rides", stats.completed_bookings ?? "—"], ["Active vehicles", stats.active_vehicles ?? "—"],
    ["Revenue (completed)", inr(stats.completed_revenue)], ["Commission earned", inr(stats.commission_earned)], ["Commission expected", inr(stats.commission_expected)], ["Orders today", stats.bookings_today ?? "—"]
  ];
  const pending = bookings.filter(b => b.status === "pending");
  return <section><div className="admin-page-heading"><div><p className="admin-eyebrow">OVERVIEW</p><h1>Dashboard</h1><p className="admin-muted">Live snapshot of your OneCar operation. Commission rate: {stats.commission_percent ?? "—"}%.</p></div></div>
    <div className="admin-stat-grid">{cards.map(([label, value]) => <article className="admin-stat" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <Flash m={message} />
    <div className="admin-panel"><div className="admin-panel-heading"><h2>New orders to review ({pending.length})</h2><Link to="/admin/bookings">All orders →</Link></div>
      <OrdersTable rows={pending.slice(0, 8)} vehicles={vehicles} onAction={act} empty="No orders waiting for a decision." /></div>
    <div className="admin-panel"><div className="admin-panel-heading"><h2>Recent orders</h2></div><OrdersTable rows={bookings.slice(0, 6)} /></div></section>;
}

function Bookings({ bookings, vehicles, refresh }) {
  const [query, setQuery] = useState(""), [tab, setTab] = useState("pending"), [message, setMessage] = useState(null);
  const act = useOrderActions(refresh, setMessage);
  const count = s => bookings.filter(b => b.status === s).length;
  const filtered = bookings.filter(b => (tab === "all" || b.status === tab) && JSON.stringify(b).toLowerCase().includes(query.toLowerCase()));
  return <section><div className="admin-page-heading"><div><p className="admin-eyebrow">RESERVATIONS</p><h1>Orders</h1><p className="admin-muted">Accept or reject new orders. Accepting assigns a vehicle from your fleet and records your commission.</p></div></div>
    <Flash m={message} />
    <div className="admin-panel">
      <div className="admin-row-actions" style={{ marginBottom: 14 }}>{[["pending", "Pending"], ["confirmed", "Accepted"], ["completed", "Completed"], ["rejected", "Rejected"], ["cancelled", "Cancelled"], ["all", "All"]].map(([k, l]) => <button key={k} className={tab === k ? "admin-primary" : "admin-secondary"} onClick={() => setTab(k)}>{l}{k !== "all" ? ` (${count(k)})` : ""}</button>)}</div>
      <input className="admin-search" placeholder="Search reference, customer, phone or route…" value={query} onChange={e => setQuery(e.target.value)} />
      <OrdersTable rows={filtered} vehicles={vehicles} onAction={act} empty={`No ${tab === "all" ? "" : (STATUS_LABEL[tab] || "").toLowerCase() + " "}orders.`} /></div></section>;
}

const blankVehicle = { name: "", category: "Comfort Sedan", registration_number: "", fuel_type: "Petrol", passengers: 3, luggage: 2, base_fare: 100, per_km: 40, airport_surcharge: 250, outstation_surcharge: 850, image_url: "", active: true };
function Vehicles({ vehicles, refresh }) {
  const [form, setForm] = useState(blankVehicle), [editing, setEditing] = useState(null), [message, setMessage] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const num = k => e => set(k, e.target.value === "" ? "" : Number(e.target.value));
  async function save(e) {
    e.preventDefault(); setMessage(null);
    try {
      await api(editing ? `/admin/vehicles/${editing}` : "/admin/vehicles", { method: editing ? "PATCH" : "POST", body: JSON.stringify(form) });
      setMessage({ ok: true, text: editing ? "Vehicle updated." : "Vehicle added." }); setForm(blankVehicle); setEditing(null); await refresh();
    } catch (err) { setMessage({ ok: false, text: err.message }); }
  }
  function edit(v) { setEditing(v.id); setForm({ name: v.name, category: v.category, registration_number: v.registration_number || "", fuel_type: v.fuel_type || "Petrol", passengers: v.passengers, luggage: v.luggage, base_fare: v.base_fare, per_km: v.per_km, airport_surcharge: v.airport_surcharge, outstation_surcharge: v.outstation_surcharge, image_url: v.image_url || "", active: v.active }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function toggle(v) { setMessage(null); try { await api(`/admin/vehicles/${v.id}`, { method: "PATCH", body: JSON.stringify({ active: !v.active }) }); await refresh(); } catch (err) { setMessage({ ok: false, text: err.message }); } }
  async function remove(v) {
    if (!window.confirm(`Delete ${v.name}${v.registration_number ? ` (${v.registration_number})` : ""}? Past orders keep their record. This cannot be undone.`)) return;
    setMessage(null); try { await api(`/admin/vehicles/${v.id}`, { method: "DELETE" }); setMessage({ ok: true, text: "Vehicle deleted." }); if (editing === v.id) { setEditing(null); setForm(blankVehicle); } await refresh(); } catch (err) { setMessage({ ok: false, text: err.message }); }
  }
  return <section><div className="admin-page-heading"><div><p className="admin-eyebrow">FLEET MANAGEMENT</p><h1>Vehicles</h1><p className="admin-muted">Add or delete cars and set their prices (₹). Customers are quoted using the cheapest active vehicle in the category they choose.</p></div></div>
    <Flash m={message} />
    <div className="admin-panel"><h2>{editing ? "Edit vehicle" : "Add a vehicle"}</h2><form className="admin-vehicle-form" onSubmit={save}>
      <label>Vehicle name<input value={form.name} onChange={e => set("name", e.target.value)} required maxLength={120} placeholder="e.g. Maruti Suzuki Dzire" /></label>
      <label>Category<select value={form.category} onChange={e => set("category", e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
      <label>Registration number<input value={form.registration_number} onChange={e => set("registration_number", e.target.value.toUpperCase())} placeholder="MH02AB1234" maxLength={14} /></label>
      <label>Fuel<select value={form.fuel_type} onChange={e => set("fuel_type", e.target.value)}>{FUELS.map(f => <option key={f}>{f}</option>)}</select></label>
      <label>Passengers<input type="number" min="1" max="20" value={form.passengers} onChange={num("passengers")} required /></label>
      <label>Luggage (bags)<input type="number" min="0" max="30" value={form.luggage} onChange={num("luggage")} required /></label>
      <label>Base fare (₹)<input type="number" min="0" max="100000" step="1" value={form.base_fare} onChange={num("base_fare")} required /></label>
      <label>Rate per km (₹)<input type="number" min="0" max="100000" step="0.5" value={form.per_km} onChange={num("per_km")} required /></label>
      <label>Airport surcharge (₹)<input type="number" min="0" max="100000" step="1" value={form.airport_surcharge} onChange={num("airport_surcharge")} /></label>
      <label>Outstation surcharge (₹)<input type="number" min="0" max="100000" step="1" value={form.outstation_surcharge} onChange={num("outstation_surcharge")} /></label>
      <label>Image URL (optional, https)<input type="url" value={form.image_url} onChange={e => set("image_url", e.target.value)} placeholder="https://…" /></label>
      <label className="admin-inline-check"><input type="checkbox" checked={Boolean(form.active)} onChange={e => set("active", e.target.checked)} /> Active for bookings</label>
      <div className="admin-form-actions"><button className="admin-primary">{editing ? "Save changes" : "Add vehicle"}</button>{editing && <button type="button" className="admin-secondary" onClick={() => { setEditing(null); setForm(blankVehicle); }}>Cancel edit</button>}</div></form></div>
    <div className="admin-panel"><h2>Your fleet ({vehicles.length})</h2>{vehicles.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Vehicle</th><th>Category</th><th>Reg. no.</th><th>Seats</th><th>Base</th><th>Per km</th><th>Airport</th><th>Outstation</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {vehicles.map(v => <tr key={v.id}><td><b>{v.name}</b><br /><small>{v.fuel_type}</small></td><td>{v.category}</td><td>{v.registration_number || "—"}</td><td>{v.passengers}</td><td>{inr(v.base_fare)}</td><td>{inr(v.per_km)}</td><td>{inr(v.airport_surcharge)}</td><td>{inr(v.outstation_surcharge)}</td>
        <td><span className={`admin-status ${v.active ? "confirmed" : "cancelled"}`}>{v.active ? "Active" : "Inactive"}</span></td>
        <td><div className="admin-row-actions"><button className="admin-secondary" onClick={() => edit(v)}>Edit / price</button><button className="admin-secondary" onClick={() => toggle(v)}>{v.active ? "Deactivate" : "Activate"}</button><button className="admin-reject" onClick={() => remove(v)}>Delete</button></div></td></tr>)}
    </tbody></table></div> : <p className="admin-empty">No vehicles yet. Add your first car above — customers cannot book a category with no active vehicle.</p>}</div></section>;
}

function Commission({ refreshStats }) {
  const [range, setRange] = useState("30d"), [data, setData] = useState(null), [error, setError] = useState(""), [message, setMessage] = useState(null), [percent, setPercent] = useState("");
  const load = useCallback(() => api(`/admin/commission?range=${range}`).then(r => { setData(r.data); setPercent(p => p === "" ? r.data.commission_percent : p); setError(""); }).catch(e => setError(e.message)), [range]);
  useEffect(() => { load(); }, [load]);
  async function savePercent(e) {
    e.preventDefault(); setMessage(null);
    try { const r = await api("/admin/settings", { method: "PATCH", body: JSON.stringify({ commission_percent: Number(percent) }) }); setMessage({ ok: true, text: r.data.message }); await load(); await refreshStats(); }
    catch (err) { setMessage({ ok: false, text: err.message }); }
  }
  const e = data?.earned, x = data?.expected;
  return <section><div className="admin-page-heading"><div><p className="admin-eyebrow">EARNINGS</p><h1>Commission</h1><p className="admin-muted">Your platform commission on each ride. “Expected” becomes “earned” when you mark the ride completed.</p></div></div>
    {error && <div className="admin-error">{error}</div>}<Flash m={message} />
    <div className="admin-panel"><h2>Commission rate</h2><form className="admin-form-actions" onSubmit={savePercent}><label className="admin-inline-check" style={{ fontSize: 12, fontWeight: 700 }}>Percent of each fare <input style={{ width: 90, padding: 10, border: "1px solid #e0e6dc", borderRadius: 10 }} type="number" min="0" max="50" step="0.5" value={percent} onChange={ev => setPercent(ev.target.value)} required /> %</label><button className="admin-primary">Save rate</button><small className="admin-muted">Applies to orders accepted from now on; accepted orders keep the rate they were accepted at.</small></form></div>
    <div className="admin-panel"><div className="admin-form-actions"><label style={{ fontSize: 12, fontWeight: 700 }}>Period <select value={range} onChange={ev => setRange(ev.target.value)}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="month">This month</option><option value="90d">Last 90 days</option><option value="all">All time</option></select></label></div></div>
    {data && <><div className="admin-stat-grid">
      <article className="admin-stat"><span>Commission earned</span><strong>{inr(e.commission)}</strong></article>
      <article className="admin-stat"><span>Commission expected</span><strong>{inr(x.commission)}</strong></article>
      <article className="admin-stat"><span>Completed rides</span><strong>{e.rides}</strong></article>
      <article className="admin-stat"><span>Owner/driver share paid out</span><strong>{inr(e.owner_payout)}</strong></article></div>
      <div className="admin-panel"><h2>Earned by category</h2>{data.by_category.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Category</th><th>Rides</th><th>Gross fares</th><th>Commission</th></tr></thead><tbody>{data.by_category.map(c => <tr key={c.category}><td>{c.category}</td><td>{c.rides}</td><td>{inr(c.gross)}</td><td>{inr(c.commission)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No completed rides in this period.</p>}</div>
      <div className="admin-panel"><h2>Ride-by-ride</h2>{data.rows.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Pickup (IST)</th><th>Vehicle</th><th>Fare</th><th>Rate</th><th>Commission</th><th>Owner share</th><th>Status</th></tr></thead><tbody>
        {data.rows.map(r => <tr key={r.id}><td>{r.booking_reference}<br /><small>{r.customer_name}</small></td><td>{when(r.pickup_at)}</td><td>{r.vehicle_name || r.vehicle_category}<br /><small>{r.vehicle_registration || ""}</small></td><td>{inr(r.total_fare)}</td><td>{r.commission_rate}%</td><td><b>{inr(r.commission_amount)}</b></td><td>{inr(r.driver_earning)}</td><td><span className={`admin-status ${r.commission_status === "earned" ? "completed" : "pending"}`}>{r.commission_status === "earned" ? "Earned" : "Expected"}</span></td></tr>)}
      </tbody></table></div> : <p className="admin-empty">Nothing yet — accept an order to see expected commission.</p>}</div></>}</section>;
}

function Customers() {
  const [rows, setRows] = useState([]), [error, setError] = useState("");
  useEffect(() => { api("/admin/customers").then(r => setRows(r.data || [])).catch(e => setError(e.message)); }, []);
  return <section><div className="admin-page-heading"><div><p className="admin-eyebrow">CUSTOMER DIRECTORY</p><h1>Customers</h1><p className="admin-muted">Everyone who has booked or registered.</p></div></div>{error && <div className="admin-error">{error}</div>}
    <div className="admin-panel">{rows.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Account</th><th>Orders</th><th>Spent (completed)</th><th>Joined</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{r.full_name}</td><td>{r.phone}</td><td>{r.email || "—"}</td><td>{r.has_account ? "Registered" : "Guest"}</td><td>{r.bookings}</td><td>{inr(r.completed_spend)}</td><td>{when(r.created_at)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No customers yet.</p>}</div></section>;
}

export default function AdminDashboard() {
  const [authorized, setAuthorized] = useState(null), [stats, setStats] = useState({}), [bookings, setBookings] = useState([]), [vehicles, setVehicles] = useState([]), [error, setError] = useState("");
  const navigate = useNavigate(), location = useLocation();
  const refresh = useCallback(async () => {
    const [s, b, v] = await Promise.all([api("/admin/dashboard"), api("/admin/bookings"), api("/admin/vehicles")]);
    setStats(s.data || {}); setBookings(b.data || []); setVehicles(v.data || []); setError("");
  }, []);
  const refreshSafe = useCallback(() => refresh().catch(e => setError(e.message)), [refresh]);
  useEffect(() => {
    let alive = true, timer;
    api("/admin/me").then(() => { if (!alive) return; setAuthorized(true); refreshSafe(); timer = setInterval(refreshSafe, 30000); }).catch(() => { if (alive) setAuthorized(false); });
    return () => { alive = false; clearInterval(timer); };
  }, [refreshSafe]);
  async function logout() { try { await api("/admin/logout", { method: "POST", body: JSON.stringify({}) }); } catch { /* already signed out */ } navigate("/admin/login", { replace: true }); }
  if (authorized === null) return <div className="admin-loading">Checking administrator access…</div>;
  if (!authorized) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <div className="admin-layout"><aside className="admin-sidebar"><Link className="admin-brand" to="/">↗ onecar<span>.</span></Link><p className="admin-sidebar-label">WORKSPACE</p>
    <nav>{sections.map(([name, path]) => <Link key={path} className={location.pathname === path ? "selected" : ""} to={path}>{name}{path === "/admin/bookings" && stats.pending_bookings > 0 ? ` (${stats.pending_bookings})` : ""}</Link>)}</nav>
    <div className="admin-sidebar-bottom"><span>Administrator</span><button onClick={logout}>Sign out</button><Link to="/">← View website</Link></div></aside>
    <main className="admin-main"><header className="admin-topbar"><span>OneCar / Admin</span><span>{stats.pending_bookings > 0 ? `${stats.pending_bookings} order(s) awaiting your decision` : "All caught up"}</span></header>
      {error && <div className="admin-error">{error}</div>}
      <Routes><Route index element={<Overview stats={stats} bookings={bookings} vehicles={vehicles} refresh={refreshSafe} />} />
        <Route path="bookings" element={<Bookings bookings={bookings} vehicles={vehicles} refresh={refreshSafe} />} />
        <Route path="vehicles" element={<Vehicles vehicles={vehicles} refresh={refreshSafe} />} />
        <Route path="commission" element={<Commission refreshStats={refreshSafe} />} />
        <Route path="customers" element={<Customers />} />
        <Route path="*" element={<Navigate to="/admin" replace />} /></Routes></main></div>;
}
