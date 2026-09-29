import { useState } from 'react';

const VEHICLE_TYPES = ['Premium Sedan', 'Luxury Sedan', 'Premium SUV', 'Luxury SUV'];

export default function BookingForm({ vehicles = [], onSubmit, submitting, initialContactPhone = '' }) {
  const [form, setForm] = useState({
    pickup_location: '',
    destination: '',
    booking_date: '',
    booking_time: '',
    vehicle_type: '',
    vehicle_id: '',
    passengers: 1,
    special_request: '',
    contact_phone: initialContactPhone,
  });
  const [errors, setErrors] = useState({});

  const filteredVehicles = form.vehicle_type
    ? vehicles.filter((v) => v.vehicle_type === form.vehicle_type && v.availability_status === 'available')
    : vehicles.filter((v) => v.availability_status === 'available');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'vehicle_type' ? { vehicle_id: '' } : {}),
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.pickup_location.trim()) errs.pickup_location = 'Pickup location is required.';
    if (!form.destination.trim()) errs.destination = 'Destination is required.';
    if (!form.booking_date) errs.booking_date = 'Date is required.';
    else if (new Date(form.booking_date) < new Date(new Date().toDateString())) errs.booking_date = 'Date cannot be in the past.';
    if (!form.booking_time) errs.booking_time = 'Time is required.';
    if (!form.vehicle_id) errs.vehicle_id = 'Please select a vehicle.';
    if (!form.passengers || form.passengers < 1) errs.passengers = 'At least 1 passenger required.';
    if (!form.contact_phone.trim()) errs.contact_phone = 'Contact phone is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate>
      <div className="form-row" style={styles.row}>
        <Field label="Pickup Location" error={errors.pickup_location}>
          <input name="pickup_location" value={form.pickup_location} onChange={handleChange}
                 placeholder="e.g. Tribhuvan International Airport" style={styles.input} />
        </Field>
        <Field label="Destination" error={errors.destination}>
          <input name="destination" value={form.destination} onChange={handleChange}
                 placeholder="e.g. Thamel, Kathmandu" style={styles.input} />
        </Field>
      </div>

      <div className="form-row" style={styles.row}>
        <Field label="Date" error={errors.booking_date}>
          <input type="date" name="booking_date" value={form.booking_date} onChange={handleChange} style={styles.input} />
        </Field>
        <Field label="Time" error={errors.booking_time}>
          <input type="time" name="booking_time" value={form.booking_time} onChange={handleChange} style={styles.input} />
        </Field>
      </div>

      <div className="form-row" style={styles.row}>
        <Field label="Vehicle Type">
          <select name="vehicle_type" value={form.vehicle_type} onChange={handleChange} style={styles.input}>
            <option value="">All Types</option>
            {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Number of Passengers" error={errors.passengers}>
          <input type="number" min="1" max="20" name="passengers" value={form.passengers} onChange={handleChange} style={styles.input} />
        </Field>
      </div>

      <Field label="Select Vehicle" error={errors.vehicle_id}>
        <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange} style={styles.input}>
          <option value="">-- Choose an available vehicle --</option>
          {filteredVehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.brand} {v.name} ({v.vehicle_type}, {v.seats} seats) — NPR {v.price_per_km}/km
            </option>
          ))}
        </select>
        {filteredVehicles.length === 0 && <small style={{ color: '#B8860B' }}>No available vehicles for this type right now.</small>}
      </Field>

      <Field label="Contact Phone" error={errors.contact_phone}>
        <input name="contact_phone" value={form.contact_phone} onChange={handleChange}
               placeholder="e.g. 9800000000" style={styles.input} />
      </Field>

      <Field label="Special Request (optional)">
        <textarea name="special_request" value={form.special_request} onChange={handleChange}
                  placeholder="Child seat, extra luggage space, etc." rows={3} style={{ ...styles.input, resize: 'vertical' }} />
      </Field>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={submitting}>
        {submitting ? <span className="spinner"></span> : 'Confirm Booking'}
      </button>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
      {error && <small style={{ color: '#C0392B' }}>{error}</small>}
    </div>
  );
}

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#0B1F3A' },
  input: {
    padding: '12px 14px',
    borderRadius: 8,
    border: '1.5px solid #E5E7EB',
    fontSize: '0.95rem',
    fontFamily: 'Inter, sans-serif',
    width: '100%',
    outline: 'none',
  },
};
