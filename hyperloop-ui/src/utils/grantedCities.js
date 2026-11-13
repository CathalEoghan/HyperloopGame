// Cities that an older Government Grants connected for free. The current grant only unlocks cities, so nothing adds to
// this list any more; it stays so a game begun under the old rule still gets no Amicable Breakups refund on them (the
// refund would be free money). They are remembered until disconnected (kept with the save, cleared by a new run).
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
