import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function CustomerAuth() {
  const location = useLocation();
  const isRegister = location.pathname === "/register";
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError(""); setMessage(""); setBusy(true);
    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const result = await api(endpoint, { method: "POST", body: JSON.stringify(form) });
      setMessage(isRegister ? "Your account was created and you are signed in." : "You are signed in.");
      window.dispatchEvent(new CustomEvent("onecar:customer-auth", { detail: result.data }));
      window.setTimeout(() => navigate("/", { replace: true }), 700);
    } catch (e) { setError(e.message || "Unable to authenticate. Check the details and API connection."); }
    finally { setBusy(false); }
  }
  return <main className="admin-auth-page"><form className="admin-auth-card" onSubmit={submit}>
    <Link className="admin-brand" to="/">↗ onecar<span>.</span></Link>
    <p className="admin-eyebrow">CUSTOMER ACCOUNT</p><h1>{isRegister ? "Create your account." : "Welcome back."}</h1>
    <p className="admin-muted">{isRegister ? "Register with your Indian mobile number and email to create a customer account." : "Sign in with the email and password registered with OneCar."}</p>
    {error && <div className="admin-error" role="alert">{error}</div>}{message && <div className="admin-success" role="status">{message}</div>}
    {isRegister && <><label htmlFor="customer-name">Full name</label><input id="customer-name" autoComplete="name" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} minLength={2} maxLength={120} required />
      <label htmlFor="customer-phone">Phone number</label><input id="customer-phone" type="tel" autoComplete="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} minLength={7} maxLength={20} required /></>}
    <label htmlFor="customer-email">Email address</label><input id="customer-email" type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
    <label htmlFor="customer-password">Password</label><input id="customer-password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} minLength={isRegister ? 10 : 1} required />
    {isRegister && <small>Use at least 10 characters, including a letter and a number. Your password is hashed before storage.</small>}
    <button className="admin-primary" disabled={busy}>{busy ? "Please wait…" : isRegister ? "Create account →" : "Sign in →"}</button>
    <Link className="admin-back-link" to={isRegister ? "/login" : "/register"}>{isRegister ? "Already have an account? Sign in" : "New to OneCar? Create an account"}</Link>
    <Link className="admin-back-link" to="/">← Return to OneCar website</Link>
    <small>Your details are stored securely in OneCar's database.</small>
  </form></main>;
}
