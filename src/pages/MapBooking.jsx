import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { api } from "../services/api";
import "leaflet/dist/leaflet.css";

const MUMBAI = [19.0760, 72.8777];
const VEHICLES = {
  "Comfort Sedan": { base: 100, perKm: 40, airport_surcharge: 250, outstation_surcharge: 850, multiplier: 1, seats: 3 },
  "Premium SUV": { base: 180, perKm: 58, airport_surcharge: 300, outstation_surcharge: 1000, multiplier: 1, seats: 5 },
  "Executive Class": { base: 300, perKm: 80, airport_surcharge: 350, outstation_surcharge: 1200, multiplier: 1, seats: 3 },
};
const mumbaiParts = (date = new Date()) => Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date).filter(p => p.type !== "literal").map(p => [p.type, p.value]));
const dateString = p => `${p.year}-${p.month}-${p.day}`;
const timeString = p => `${p.hour}:${p.minute}`;
const todayLocal = () => dateString(mumbaiParts());
const defaultPickup = () => mumbaiParts(new Date(Date.now() + 60 * 60 * 1000));
const money = n => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function MapEvents({ onPoint }) {
  useMapEvents({ click(e) { onPoint([e.latlng.lat, e.latlng.lng]); } });
  return null;
}
function FitRoute({ route }) {
  const map = useMap();
  useEffect(() => { if (route?.coordinates?.length > 1) map.fitBounds(route.coordinates, { padding: [28, 28] }); }, [route, map]);
  return null;
}
function makeIcon(color, label) {
  return L.divIcon({ className: "onecar-map-marker-wrap", html: `<div class="onecar-map-marker ${color}"><span>${label}</span></div>`, iconSize: [30, 38], iconAnchor: [15, 34] });
}
const pickupIcon = makeIcon("pickup", "P");
const destinationIcon = makeIcon("destination", "D");

async function geocode(query) {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Location search is temporarily unavailable. You can select the point directly on the map.");
  const rows = await response.json();
  if (!rows.length) throw new Error("Location not found. Try a nearby landmark or select it on the map.");
  return { label: rows[0].display_name, point: [Number(rows[0].lat), Number(rows[0].lon)] };
}
async function getRoute(from, to) {
  // Try two public OSRM-compatible routing services. Public demo services can
  // occasionally be unavailable or rate-limited, so do not rely on just one.
  const coordinatePair = `${from[1]},${from[0]};${to[1]},${to[0]}`;
  const endpoints = [
    `https://router.project-osrm.org/route/v1/driving/${coordinatePair}?overview=full&geometries=geojson`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordinatePair}?overview=full&geometries=geojson`,
  ];
  let lastError;
  for (const url of endpoints) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        lastError = new Error(`Routing service returned HTTP ${response.status}.`);
        continue;
      }
      const result = await response.json();
      if (result.code !== "Ok" || !result.routes?.length) {
        lastError = new Error("No driving route found for these points.");
        continue;
      }
      const r = result.routes[0];
      return {
        km: r.distance / 1000,
        minutes: Math.ceil(r.duration / 60),
        coordinates: r.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    "Could not fetch a road route. Check your internet connection and try again. If it keeps happening, the public routing services may be temporarily unavailable or blocked on your network."
  );
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = "https://checkout.razorpay.com/v1/checkout.js"; el.onload = resolve;
    el.onerror = () => reject(new Error("Could not load the payment window. Check your connection."));
    document.body.appendChild(el);
  });
}
// Opens Razorpay Checkout (UPI / cards / netbanking). Resolves true only after the server verified the signature.
async function payWithRazorpay(booking) {
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: booking.razorpay.key_id, order_id: booking.razorpay.order_id, amount: booking.razorpay.amount, currency: "INR",
      name: "OneCar", description: `Booking ${booking.booking_reference}`,
      prefill: { name: booking.customer_name, contact: booking.customer_phone, email: booking.customer_email || "" },
      theme: { color: "#14211d" },
      handler: async (response) => {
        try { await api("/bookings/payment/verify", { method: "POST", body: JSON.stringify({ booking_reference: booking.booking_reference, ...response }) }); resolve(true); }
        catch (err) { reject(err); }
      },
      modal: { ondismiss: () => resolve(false) },
    });
    rzp.on("payment.failed", () => resolve(false));
    rzp.open();
  });
}

export default function MapBooking() {
  const [rideType, setRideType] = useState("City ride");
  const [vehicle, setVehicle] = useState("Comfort Sedan");
  const [pickup, setPickup] = useState({ label: "Bandra, Mumbai, Maharashtra, India", point: [19.0600, 72.8360] });
  const [destination, setDestination] = useState({ label: "Chhatrapati Shivaji Maharaj International Airport, Mumbai, India", point: [19.0896, 72.8656] });
  const [route, setRoute] = useState(null);
  const [routeBusy, setRouteBusy] = useState(false);
  const [locationMode, setLocationMode] = useState("pickup");
  const [searchPickup, setSearchPickup] = useState("Bandra, Mumbai, Maharashtra, India");
  const [searchDestination, setSearchDestination] = useState("Chhatrapati Shivaji Maharaj International Airport, Mumbai, India");
  const [locationError, setLocationError] = useState("");
  const [routeError, setRouteError] = useState("");
  const [date, setDate] = useState(() => dateString(defaultPickup()));
  const [time, setTime] = useState(() => timeString(defaultPickup()));
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [bookingResult, setBookingResult] = useState(null);
  const [fareRules, setFareRules] = useState(VEHICLES);
  const [onlinePayments, setOnlinePayments] = useState(false);

  useEffect(() => {
    api("/pricing/config").then(r => { if (r?.data?.vehicles) setFareRules(prev => ({ ...prev, ...r.data.vehicles })); setOnlinePayments(Boolean(r?.data?.online_payments)); }).catch(() => {});
    const onCar = e => { if (VEHICLES[e.detail?.car]) setVehicle(e.detail.car); };
    window.addEventListener("onecar:select-car", onCar);
    return () => window.removeEventListener("onecar:select-car", onCar);
  }, []);

  useEffect(() => {
    let active = true;
    if (!pickup?.point || !destination?.point) { setRoute(null); return; }
    setRouteBusy(true); setRouteError("");
    getRoute(pickup.point, destination.point).then(r => { if (active) setRoute(r); }).catch(e => { if (active) { setRoute(null); setRouteError(e.message); } }).finally(() => { if (active) setRouteBusy(false); });
    return () => { active = false; };
  }, [pickup, destination]);

  const pricing = fareRules[vehicle] || VEHICLES[vehicle];
  const fare = useMemo(() => {
    if (!route || !pricing) return null;
    const base = Number(pricing.base ?? pricing.base_fare ?? 100);
    const perKm = Number(pricing.perKm ?? pricing.per_km ?? 40);
    const multiplier = Number(pricing.multiplier ?? 1);
    const tripSurcharge = rideType === "Airport" ? Number(pricing.airport_surcharge ?? pricing.airportSurcharge ?? 250) : rideType === "Outstation" ? Number(pricing.outstation_surcharge ?? pricing.outstationSurcharge ?? 850) : 0;
    return Math.max(0, Math.ceil((base + route.km * perKm + tripSurcharge) * multiplier));
  }, [route, pricing, rideType]);

  async function searchLocation(which) {
    const query = which === "pickup" ? searchPickup : searchDestination;
    if (!query.trim()) return;
    setLocationError("");
    try {
      const found = await geocode(query.trim());
      if (which === "pickup") { setPickup(found); setSearchPickup(found.label); }
      else { setDestination(found); setSearchDestination(found.label); }
    } catch (e) { setLocationError(e.message); }
  }
  function handleMapPoint(point) {
    setLocationError("");
    if (locationMode === "pickup") {
      setPickup({ point, label: `Map point ${point[0].toFixed(5)}, ${point[1].toFixed(5)}` });
      setSearchPickup(`Map point ${point[0].toFixed(5)}, ${point[1].toFixed(5)}`);
      setLocationMode("destination");
    } else {
      setDestination({ point, label: `Map point ${point[0].toFixed(5)}, ${point[1].toFixed(5)}` });
      setSearchDestination(`Map point ${point[0].toFixed(5)}, ${point[1].toFixed(5)}`);
    }
  }
  function validateBooking() {
    if (!route || !fare) return "Wait for a valid road route and fare estimate.";
    if (!customer.name.trim() || !customer.phone.trim()) return "Enter your name and phone number.";
    if (!/^[6-9]\d{9}$/.test(customer.phone.replace(/[\s\-()]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))) return "Enter a valid 10-digit Indian mobile number.";
    const scheduled = new Date(`${date}T${time}:00+05:30`);
    if (!date || !time || Number.isNaN(scheduled.getTime())) return "Choose a valid pickup date and time.";
    if (scheduled.getTime() <= Date.now()) return "Pickup date and time must be in the future.";
    if (pickup.label === destination.label || (pickup.point[0] === destination.point[0] && pickup.point[1] === destination.point[1])) return "Pickup and destination must be different.";
    return "";
  }
  async function submitBooking(e) {
    e.preventDefault(); setMessage("");
    const validation = validateBooking();
    if (validation) { setMessage(validation); return; }
    setShowConfirm(true);
  }
  async function confirmBooking() {
    setBusy(true); setMessage("");
    const payload = {
      customer_name: customer.name.trim(), customer_phone: customer.phone.trim(), customer_email: customer.email.trim() || null,
      ride_type: rideType, vehicle_category: vehicle, pickup_location: pickup.label, destination: destination.label,
      pickup_lat: pickup.point[0], pickup_lng: pickup.point[1], destination_lat: destination.point[0], destination_lng: destination.point[1],
      distance_km: Number(route.km.toFixed(3)), duration_minutes: route.minutes, pickup_date: date, pickup_time: time,
      payment_method: paymentMethod
    };
    try {
      const saved = await api("/bookings", { method: "POST", body: JSON.stringify(payload) });
      const booking = saved?.data || saved;
      if (paymentMethod === "online" && booking.razorpay) {
        try {
          const paid = await payWithRazorpay(booking);
          booking.payment_status = paid ? "paid" : "pending";
          if (!paid) booking.paymentNote = "Payment was not completed. Your request is saved; our team will contact you, or you can pay the driver in cash.";
        } catch (err) { booking.paymentNote = err.message; }
      }
      setBookingResult(booking); setShowConfirm(false); setMessage("");
    } catch (err) { setMessage(err.message || "Unable to create the booking."); setShowConfirm(false); }
    finally { setBusy(false); }
  }

  return <section className="booking-wrap map-booking-wrap" id="booking"><div className="container">
    <form className="booking map-booking" onSubmit={submitBooking}>
      <div className="booking-top"><div><div className="booking-title">Where would you like to go?</div><div className="sub">Choose real road routes and get a distance-based fare in ₹.</div></div>
        <div className="tabs">{["City ride","Airport","Outstation"].map(t=><button key={t} type="button" className={`tab ${rideType===t?"active":""}`} onClick={()=>setRideType(t)}>{t}</button>)}</div>
      </div>
      <div className="map-location-grid">
        <div className="field"><label htmlFor="pickup-search">Pickup location</label><div className="map-search-row"><input id="pickup-search" value={searchPickup} onChange={e=>setSearchPickup(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();searchLocation("pickup");}}} placeholder="Search pickup location"/><button type="button" onClick={()=>searchLocation("pickup")}>Find</button></div></div>
        <div className="field"><label htmlFor="destination-search">Destination</label><div className="map-search-row"><input id="destination-search" value={searchDestination} onChange={e=>setSearchDestination(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();searchLocation("destination");}}} placeholder="Search destination"/><button type="button" onClick={()=>searchLocation("destination")}>Find</button></div></div>
      </div>
      <div className="map-instructions"><span><b>Map selection:</b> {locationMode === "pickup" ? "click the map to set pickup" : "click the map to set destination"}</span><div className="map-mode-toggle"><button type="button" className={locationMode==="pickup"?"selected":""} onClick={()=>setLocationMode("pickup")}>Set pickup</button><button type="button" className={locationMode==="destination"?"selected":""} onClick={()=>setLocationMode("destination")}>Set destination</button></div></div>
      <div className="onecar-map"><MapContainer center={MUMBAI} zoom={12} scrollWheelZoom={true}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEvents onPoint={handleMapPoint}/>
        {pickup?.point && <Marker position={pickup.point} icon={pickupIcon}/>}
        {destination?.point && <Marker position={destination.point} icon={destinationIcon}/>}
        {route?.coordinates?.length > 1 && <Polyline positions={route.coordinates} pathOptions={{ color: "#789653", weight: 5, opacity: 0.9 }}/>}
        <FitRoute route={route}/>
      </MapContainer></div>
      {locationError && <p className="map-error" role="alert">{locationError}</p>}
      <div className="map-route-summary"><div><span className="route-dot pickup-dot"/> <div><small>Pickup</small><strong>{pickup.label}</strong></div></div><div><span className="route-dot destination-dot"/><div><small>Destination</small><strong>{destination.label}</strong></div></div>
        <div className="route-metric"><small>Road distance</small><strong>{route ? `${route.km.toFixed(1)} km` : routeBusy ? "Calculating…" : "—"}</strong></div><div className="route-metric"><small>Estimated time</small><strong>{route ? `${route.minutes} min` : "—"}</strong></div></div>
      {routeError && <p className="map-error" role="alert">{routeError} Check the selected points or try again.</p>}
      <div className="map-booking-bottom">
        <div className="map-booking-fields">
          <div className="field"><label htmlFor="ride-date">Pickup date</label><input id="ride-date" type="date" min={todayLocal()} value={date} onChange={e=>setDate(e.target.value)} required/></div>
          <div className="field"><label htmlFor="ride-time">Pickup time</label><input id="ride-time" type="time" value={time} onChange={e=>setTime(e.target.value)} required/></div>
          <div className="field"><label htmlFor="vehicle-category">Vehicle category</label><select id="vehicle-category" value={vehicle} onChange={e=>setVehicle(e.target.value)}>{Object.keys(VEHICLES).map(v=><option key={v}>{v}</option>)}</select></div>
        </div>
        <div className="map-fare-card"><div><small>Estimated fare</small><strong>{fare === null ? "—" : money(fare)}</strong><span>{route ? `${route.km.toFixed(1)} km × vehicle rate` : "Select a valid route"}</span></div><button className="btn lime submit" type="submit" disabled={routeBusy || !route || !fare}>Continue booking →</button></div>
      </div>
      <div className="map-customer-fields"><div className="field"><label htmlFor="customer-name">Your name</label><input id="customer-name" autoComplete="name" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} placeholder="Full name" required/></div><div className="field"><label htmlFor="customer-phone">Phone number</label><input id="customer-phone" autoComplete="tel" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})} placeholder="98XXXXXXXX" inputMode="tel" required/></div><div className="field"><label htmlFor="customer-email">Email (optional)</label><input id="customer-email" type="email" autoComplete="email" value={customer.email} onChange={e=>setCustomer({...customer,email:e.target.value})} placeholder="you@example.com"/></div><div className="field"><label htmlFor="payment-method">Payment method</label><select id="payment-method" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}><option value="cash">Cash to driver</option>{onlinePayments && <option value="online">Pay online (UPI / card)</option>}</select></div></div>
      <div className="note"><span>◈ <b>Map-based fare estimate</b> · Calculated from road distance</span><span>Your request is confirmed once our team accepts it.</span></div>
      {message && <div className="map-message" role="alert">{message}</div>}
    </form>
  </div>
  {showConfirm && <div className="map-modal-backdrop" role="presentation"><div className="map-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div className="modal-head"><h3 id="confirm-title">Confirm booking</h3><button className="close" type="button" onClick={()=>setShowConfirm(false)} aria-label="Close">×</button></div><p>{pickup.label} → {destination.label}</p><div className="estimate"><div><small>Road distance</small><strong>{route?.km.toFixed(1)} km</strong></div><div style={{textAlign:"right"}}><small>Estimated fare</small><strong>{money(fare)}</strong></div></div><p>Payment: {paymentMethod === "cash" ? "Cash to driver" : "Online (UPI / card)"}. Pickup: {date} at {time}.</p><button className="btn dark" type="button" disabled={busy} onClick={confirmBooking}>{busy ? "Saving booking…" : "Confirm booking"}</button></div></div>}
  {bookingResult && <div className="map-modal-backdrop" role="presentation"><div className="map-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="booking-success-title"><div className="booking-success-mark">✓</div><h3 id="booking-success-title">Booking request received</h3><p>Your reference is <b>{bookingResult.booking_reference || bookingResult.id}</b>.</p><div className="estimate"><div><small>Fare</small><strong>{money(bookingResult.total_fare || fare)}</strong></div><div style={{textAlign:"right"}}><small>Payment status</small><strong style={{fontSize:14}}>{({ pending_cash: "Pay driver in cash", pending: "Awaiting payment", paid: "Paid" })[bookingResult.payment_status] || bookingResult.payment_status}</strong></div></div><p>{bookingResult.paymentNote || "Your request has been sent. Our team will accept or reject it shortly — we'll contact you on your mobile number."}</p><button className="btn dark" type="button" onClick={()=>setBookingResult(null)}>Done</button></div></div>}
  </section>;
}
