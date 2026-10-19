import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

const INFO = {
  pending: ["⏳", "Waiting for approval", "Our team is reviewing your request. This page updates by itself — you can keep it open."],
  confirmed: ["✅", "Accepted — your ride is confirmed", "Your vehicle is assigned. Please be ready at the pickup point on time."],
  rejected: ["❌", "Sorry, this request was rejected", "You have not been charged. You can book again for another time or vehicle."],
  cancelled: ["⚠️", "This booking was cancelled", "If you paid online, a refund will be arranged by our team."],
  completed: ["🏁", "Ride completed", "Thank you for riding with OneCar."],
};
const PAY = { pending_cash: "Cash to driver", pending: "Awaiting online payment", paid: "Paid", failed: "Payment failed", refund_due: "Refund due" };
const when = iso => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) + " IST";
const readSaved = () => { try { return JSON.parse(localStorage.getItem("onecar_my_bookings") || "[]"); } catch { return []; } };

export default function TrackBooking() {
  const [params] = useSearchParams();
  const [reference, setReference] = useState(params.get("ref") || "");
  const [phone, setPhone] = useState(params.get("phone") || "");
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved] = useState(readSaved);

  const load = useCallback(async (ref, ph, quiet) => {
    if (!quiet) { setBusy(true); setError(""); }
    try {
      const r = await api(`/bookings/track?reference=${encodeURIComponent(ref.trim())}&phone=${encodeURIComponent(ph.trim())}`);
      setBooking(r.data);
      setError("");
    } catch (e) { if (!quiet) { setBooking(null); setError(e.message); } }
    finally { if (!quiet) setBusy(false); }
  }, []);

  // Open straight away when coming from the booking confirmation link.
  useEffect(() => { if (params.get("ref") && params.get("phone")) load(params.get("ref"), params.get("phone")); }, [params, load]);
  // Refresh every 30 seconds while the booking can still change (and the tab is visible).
  useEffect(() => {
    if (!booking || !["pending", "confirmed"].includes(booking.status)) return;
    const t = setInterval(() => { if (!document.hidden) load(booking.booking_reference, phone || params.get("phone") || "", true); }, 30000);
    return () => clearInterval(t);
  }, [booking, phone, params, load]);

  const info = booking ? INFO[booking.status] : null;
  return <main className="admin-auth-page"><div className="admin-auth-card" style={{ width: "min(560px,100%)" }}>
    <Link className="admin-brand" to="/">↗ onecar<span>.</span></Link>
    <p className="admin-eyebrow">TRACK YOUR BOOKING</p><h1>Where is my ride?</h1>
    <p className="admin-muted">Enter the booking reference you received and the mobile number you booked with.</p>
    {error && <div className="admin-error" role="alert">{error}</div>}
    <form style={{ display: "flex", flexDirection: "column", gap: 11 }} onSubmit={e => { e.preventDefault(); load(reference, phone); }}>
      <label htmlFor="track-ref">Booking reference</label>
      <input id="track-ref" value={reference} onChange={e => setReference(e.target.value)} placeholder="OC-XXXXXXXXXX" autoCapitalize="characters" required />
      <label htmlFor="track-phone">Mobile number</label>
      <input id="track-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="98XXXXXXXX" inputMode="tel" required />
      <button className="admin-primary" disabled={busy}>{busy ? "Checking…" : "Check status →"}</button>
    </form>
    {saved.length > 0 && !booking && <div style={{ marginTop: 6 }}>
      <p className="admin-muted" style={{ margin: "8px 0" }}>Your recent bookings on this device:</p>
      <div className="admin-row-actions">{saved.map(s => <button key={s.ref} type="button" className="admin-secondary" onClick={() => { setReference(s.ref); setPhone(s.phone); load(s.ref, s.phone); }}>{s.ref}</button>)}</div>
    </div>}
    {booking && info && <div style={{ marginTop: 14, border: "1px solid #e4e9df", borderRadius: 16, padding: 18, background: "#fbfcfa" }}>
      <div style={{ fontSize: 34 }}>{info[0]}</div>
      <h2 style={{ font: "800 20px Manrope,sans-serif", margin: "6px 0 4px" }}>{info[1]}</h2>
      <p className="admin-muted" style={{ marginTop: 0 }}>{info[2]}</p>
      {booking.status_reason && <div className="admin-error" style={{ marginTop: 8 }}><b>Reason:</b> {booking.status_reason}</div>}
      <table className="admin-table" style={{ marginTop: 8, whiteSpace: "normal" }}><tbody>
        <tr><td>Reference</td><td><b>{booking.booking_reference}</b></td></tr>
        <tr><td>Route</td><td>{booking.pickup_location} → {booking.destination}</td></tr>
        <tr><td>Pickup</td><td>{when(booking.pickup_at)}</td></tr>
        <tr><td>Ride</td><td>{booking.ride_type} · {booking.vehicle_category}</td></tr>
        {booking.vehicle_name && <tr><td>Vehicle</td><td>{booking.vehicle_name}{booking.vehicle_registration ? ` · ${booking.vehicle_registration}` : ""}</td></tr>}
        <tr><td>Fare</td><td>₹{Number(booking.total_fare).toLocaleString("en-IN")}</td></tr>
        <tr><td>Payment</td><td>{PAY[booking.payment_status] || booking.payment_status}</td></tr>
      </tbody></table>
      <div className="admin-row-actions" style={{ marginTop: 12 }}><button className="admin-secondary" type="button" onClick={() => load(booking.booking_reference, phone || params.get("phone") || "")}>Refresh now</button></div>
    </div>}
    <Link className="admin-back-link" to="/">← Return to OneCar website</Link>
  </div></main>;
}
