// Distances are worked out in miles everywhere in the game; this only changes how they are shown.
const KEY = 'distanceUnit'
const KM_PER_MILE = 1.609344

export function getDistanceUnit() {
    try { return localStorage.getItem(KEY) === 'km' ? 'km' : 'mi' } catch { return 'mi' }
}

export function setDistanceUnit(unit) {
    try { localStorage.setItem(KEY, unit === 'km' ? 'km' : 'mi') } catch { /* storage unavailable */ }
}

// "10,560 miles" or "16,994 km", whole numbers
export function formatDistance(miles, unit = getDistanceUnit()) {
    const value = unit === 'km' ? miles * KM_PER_MILE : miles
    return `${Math.round(value).toLocaleString('en-GB')} ${unit === 'km' ? 'km' : 'miles'}`
}
