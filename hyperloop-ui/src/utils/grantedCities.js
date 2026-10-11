// Cities that Government Grants connected for free. Amicable Breakups refunds half the connection cost, which
// would be free money for these, so they are remembered until disconnected (kept with the save, cleared by a new run).
export const GRANTED_CITIES_KEY = 'hyperloop_granted_cities'

export function readGrantedCities() {
    try {
        const list = JSON.parse(localStorage.getItem(GRANTED_CITIES_KEY))
        return Array.isArray(list) ? list : []
    } catch { return [] }
}

export function writeGrantedCities(names) {
    try { localStorage.setItem(GRANTED_CITIES_KEY, JSON.stringify(names)) } catch { /* storage full */ }
}

export const isGrantedCity = name => readGrantedCities().includes(name)
