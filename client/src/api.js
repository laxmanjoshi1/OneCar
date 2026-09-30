// All calls to the backend live here. The backend talks to SQL.
async function request(path, options) {
  let res
  try {
    res = await fetch('/api' + path, { headers: { 'Content-Type': 'application/json' }, ...options })
  } catch {
    throw new Error('Cannot reach the server. Start it with "npm start" in the server folder.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) { const err = new Error(data.error || 'Something went wrong.'); err.status = res.status; throw err }
  return data
}
const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) })

export const getPlaces = () => request('/places')
export const getQuote = (pickupId, dropoffId) => post('/quote', { pickupId, dropoffId })
export const bookTrip = trip => post('/trips', trip)
export const joinWaitlist = email => post('/waitlist', { email })
