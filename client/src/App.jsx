import { useEffect, useRef, useState } from 'react'
import { getPlaces, getQuote, bookTrip, joinWaitlist } from './api'

const CUR = '$'
const IMG_HERO = '/images/hero.jpg' // your photo: client/public/images/hero.jpg

/* ---------- Header ---------- */
function Header() {
  return (
    <header className="top">
      <div className="wrap nav">
        <a className="logo" href="#top"><b />OneCar</a>
        <div className="links"><a href="#how">How it works</a><a href="#why">Why OneCar</a><a href="#drive">Drive</a><a href="#safety">Safety</a></div>
        <div className="nav-r"><a href="#top">Log in</a><a className="btn" href="#join">Join early access</a></div>
      </div>
    </header>
  )
}

/* ---------- Hero (photo + overlay; black is the fallback) ---------- */
function Hero() {
  return (
    <div className="hero" style={{ backgroundImage: `url(${IMG_HERO})` }}>
      <div className="wrap hero-in">
        <h1>One tap.<br />One car.<span>One clear price.</span></h1>
        <p>See exactly what your ride costs before you book. No surge surprises, no hidden fees.</p>
      </div>
    </div>
  )
}

/* ---------- Place input with suggestions ---------- */
function PlaceInput({ id, label, placeholder, places, onPick }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const list = places.filter(p => p.name.toLowerCase().includes(text.trim().toLowerCase()))
  return (
    <div className="f">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={text} placeholder={placeholder} autoComplete="off"
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={e => { setText(e.target.value); onPick(null); setOpen(true) }} />
      {open && list.length > 0 && (
        <ul className="sg">
          {list.map(p => (
            <li key={p.id} onMouseDown={() => { setText(p.name); onPick(p); setOpen(false) }}>
              <b>{p.name}</b><small>{p.subtitle}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------- Animated route ---------- */
function RouteMap({ playKey }) {
  const route = useRef(null), car = useRef(null)
  useEffect(() => {
    const path = route.current, g = car.current, len = path.getTotalLength()
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const e = path.getPointAtLength(len); g.setAttribute('transform', `translate(${e.x},${e.y})`); return
    }
    let raf, t0 = performance.now()
    const step = now => {
      const t = Math.min((now - t0) / 1500, 1), k = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const p = path.getPointAtLength(len * k), n = path.getPointAtLength(Math.min(len * k + 2, len))
      g.setAttribute('transform', `translate(${p.x},${p.y}) rotate(${Math.atan2(n.y - p.y, n.x - p.x) * 180 / Math.PI})`)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [playKey])
  return (
    <svg viewBox="0 0 300 150" aria-hidden="true">
      <path ref={route} className="route" d="M30 110 C 90 20, 200 140, 270 40" />
      <circle cx="30" cy="110" r="7" fill="#fff" /><circle cx="270" cy="40" r="7" fill="#FF6A1F" />
      <g ref={car}><rect x="-12" y="-6" width="24" height="12" rx="3" fill="#FF6A1F" /><rect x="-5" y="-4" width="10" height="4" fill="#151515" /></g>
    </svg>
  )
}

/* ---------- Booking widget (talks to /api → SQL) ---------- */
function Booking() {
  const [places, setPlaces] = useState([])
  const [pickup, setPickup] = useState(null)
  const [dropoff, setDropoff] = useState(null)
  const [mode, setMode] = useState('now')
  const [time, setTime] = useState('Now')
  const [quote, setQuote] = useState(null)
  const [selected, setSelected] = useState(null)
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState('')
  const [runs, setRuns] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => { getPlaces().then(setPlaces).catch(e => setMsg(e.message)) }, [])

  async function seePrices() {
    setDone('')
    if (!pickup || !dropoff) return setMsg('Choose pickup and drop-off from the suggestions.')
    if (pickup.id === dropoff.id) return setMsg('Pickup and drop-off must be different.')
    setMsg(''); setBusy(true)
    try {
      const q = await getQuote(pickup.id, dropoff.id)
      setQuote(q); setSelected(q.rides[0]); setRuns(n => n + 1)
    } catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }

  async function book() {
    setBusy(true)
    try {
      const r = await bookTrip({ pickupId: pickup.id, dropoffId: dropoff.id, rideTypeId: selected.id, pickupTime: time })
      setDone(`Trip #${r.tripId} booked with ${r.rideName}. Your fare is locked at ${CUR}${r.fare.toFixed(2)}.`)
    } catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="widget"><div className="wrap"><div className="box">
      <div className="tabs" role="tablist" aria-label="Trip type">
        {[['now', 'Ride now'], ['later', 'Schedule']].map(([m, l]) => (
          <button key={m} role="tab" aria-selected={mode === m} className="tab"
            onClick={() => { setMode(m); if (m === 'now') setTime('Now') }}>{l}</button>
        ))}
      </div>
      <div className="fields">
        <PlaceInput id="pickup" label="Pickup" placeholder="Enter pickup" places={places} onPick={setPickup} />
        <PlaceInput id="dropoff" label="Drop-off" placeholder="Enter destination" places={places} onPick={setDropoff} />
        <div className="f">
          <label htmlFor="time">When</label>
          <select id="time" value={time} disabled={mode === 'now'} onChange={e => setTime(e.target.value)}>
            <option>Now</option><option>Today 6:00 PM</option><option>Tomorrow 8:00 AM</option>
          </select>
        </div>
        <button className="btn" onClick={seePrices} disabled={busy}>See prices</button>
      </div>
      <div className="msg" role="alert">{msg}</div>

      {quote && (
        <div className="res" aria-live="polite">
          <div className="mapbox">
            <RouteMap playKey={runs} />
            <div className="sum">{pickup.name} to {dropoff.name} · {quote.km} km · about {quote.minutes} min</div>
          </div>
          <div className="rides">
            <div role="radiogroup" aria-label="Ride options">
              {quote.rides.map(r => (
                <div key={r.id} className="ride" role="radio" tabIndex={0} aria-checked={selected?.id === r.id}
                  onClick={() => setSelected(r)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(r) } }}>
                  <div className="ic"><svg width="26" height="16" viewBox="0 0 26 16"><rect x="1" y="5" width="24" height="8" rx="3" fill="#FF6A1F" /><rect x="6" y="1" width="12" height="6" rx="2" fill="#FF6A1F" /></svg></div>
                  <div className="t"><b>{r.name}</b><small>{r.description}</small></div>
                  <div className="p">{CUR}{r.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
            <button className="btn dark" onClick={book} disabled={busy}>Choose {selected?.name}</button>
            {done && <p className="ok" role="status">{done}</p>}
          </div>
        </div>
      )}
    </div></div></div>
  )
}

/* ---------- Content sections ---------- */
const STEPS = [
  ['Set your trip', "Enter where you are and where you're going."],
  ['See the full price', 'The fare is shown up front and never changes mid-ride.'],
  ['Ride', 'A nearby driver is matched and you follow the car live.'],
]
const FEATURES = [
  ['Fixed prices', 'The price you see is the price you pay. No extra fees at the end.'],
  ['Short waits', 'Matching favors nearby cars first, so pickups are quick.'],
  ['Verified drivers', "Every driver's ID and vehicle are checked before the first ride."],
]
const QUOTES = [
  'I knew the price before I got in. That alone made me switch.',
  'The car arrived faster than I expected. Polite driver too.',
  'Simple app. I booked in under a minute on my phone.',
]

const Steps = () => (
  <section id="how"><div className="wrap">
    <div className="head"><h2>Book a ride in three steps</h2><p>No account maze. Set your trip, see the price, go.</p></div>
    <div className="steps">{STEPS.map(([t, d]) => <div className="step" key={t}><h3>{t}</h3><p>{d}</p></div>)}</div>
  </div></section>
)

const Features = () => (
  <section className="dark" id="why"><div className="wrap">
    <div className="head"><h2>Built around what riders complain about</h2><p>Three problems, three fixes.</p></div>
    <div className="feat">{FEATURES.map(([t, d]) => <div className="fc" key={t}><h3>{t}</h3><p>{d}</p></div>)}</div>
  </div></section>
)

const Proof = () => (
  <section><div className="wrap">
    <div className="head"><h2>What early riders say</h2></div>
    <div className="stats">
      <div><b>250+</b><span>early testers</span></div><div><b>4.8</b><span>average pilot rating</span></div><div><b>6 min</b><span>average pickup</span></div>
    </div>
    <div className="quotes">{QUOTES.map(q => <div className="q" key={q}><p>{q}</p><small>Pilot rider, placeholder</small></div>)}</div>
  </div></section>
)

const DriveSafety = () => (
  <section id="drive" style={{ paddingTop: 0 }}><div className="wrap"><div className="split" id="safety">
    <div className="a"><h2>Drive with OneCar</h2><p>Turn your car into steady income. Sign up, get verified, and accept rides when it suits you.</p><a className="btn dark" href="#top">Start driving</a></div>
    <div className="b"><h2>Safety first</h2><ul className="ck"><li>Drivers and vehicles verified before trip one</li><li>Share live trip status in one tap</li><li>Emergency button and 24/7 support</li></ul></div>
  </div></div></section>
)

/* ---------- Waitlist (saved in SQL) ---------- */
function Waitlist() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  async function submit(e) {
    e.preventDefault()
    try { await joinWaitlist(email); setMsg("You're on the list. We'll email you when OneCar is ready."); setEmail('') }
    catch (err) { setMsg(err.message) }
  }
  return (
    <section className="cta" id="join"><div className="wrap">
      <h2>Be one of the first to ride</h2>
      <p>Leave your email and we'll tell you the moment OneCar opens in your area.</p>
      <form className="join" onSubmit={submit} noValidate>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" aria-label="Email address" />
        <button className="btn dark" type="submit">Join early access</button>
      </form>
      <div className="jm" role="status">{msg}</div>
    </div></section>
  )
}

const Footer = () => (
  <footer><div className="wrap">
    <div className="fg">
      <div><div className="logo"><b />OneCar</div><p>Clear prices. Verified drivers. Quick pickups.</p></div>
      {[['Company', ['About us', 'Careers', 'Blog']], ['Products', ['Ride', 'Drive', 'Business']], ['Support', ['Help center', 'Safety', 'Contact']]].map(([h, items]) => (
        <div key={h}><h4>{h}</h4><ul>{items.map(i => <li key={i}><a href="#top">{i}</a></li>)}</ul></div>
      ))}
    </div>
    <div className="cp">© 2026 OneCar.</div>
  </div></footer>
)

export default function App() {
  return (
    <>
      <Header />
      <main id="top"><Hero /><Booking /><Steps /><Features /><Proof /><DriveSafety /><Waitlist /></main>
      <Footer />
    </>
  )
}
