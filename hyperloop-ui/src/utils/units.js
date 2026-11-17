// Distances are worked out in miles everywhere in the game; this only changes how they are shown.
const KEY = 'distanceUnit'
const KM_PER_MILE = 1.609344

export function getDistanceUnit() {
    try { return localStorage.getItem(KEY) === 'km' ? 'km' : 'mi' } catch { return 'mi' }
}

export function setDistanceUnit(unit) {
    try { localStorage.setItem(KEY, unit === 'km' ? 'km' : 'mi') } catch { /* storage unavailable */ }
}

// The raw number a distance in miles becomes in the player's chosen unit, with no rounding or suffix - for a
// caller (Progress page's Total distance travelled) that abbreviates it itself rather than just printing it.
export function convertDistance(miles, unit = getDistanceUnit()) {
    return unit === 'km' ? miles * KM_PER_MILE : miles
}

// "10,560 miles" or "16,994 km", whole numbers
export function formatDistance(miles, unit = getDistanceUnit()) {
    return `${Math.round(convertDistance(miles, unit)).toLocaleString('en-GB')} ${unit === 'km' ? 'km' : 'miles'}`
}

// Clock format. Only changes how times are shown (top bar, emails, Hyper-Link), never how they are worked out.
// Until the player picks one, it follows what their device normally uses.
const TIME_KEY = 'timeFormat'

export function getTimeFormat() {
    try {
        const saved = localStorage.getItem(TIME_KEY)
        if (saved === '12h' || saved === '24h') return saved
    } catch { /* storage unavailable */ }
    try { return new Intl.DateTimeFormat([], { hour: 'numeric' }).resolvedOptions().hour12 ? '12h' : '24h' } catch { return '24h' }
}

export function setTimeFormat(format) {
    try { localStorage.setItem(TIME_KEY, format === '12h' ? '12h' : '24h') } catch { /* storage unavailable */ }
}

// "14:46" or "02:46 pm"
export function formatClock(date = new Date(), format = getTimeFormat()) {
    const d = date instanceof Date ? date : new Date(date)
    if (format === '12h') return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
