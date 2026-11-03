// Flight-number-style codes for loops, mimicking a real departure/arrival board: each connected city's
// three-letter code (cityLoopCodes.js) followed by a number, e.g. "FRA008".
//
// Departures and arrivals are numbered differently on purpose:
//   - Departure numbers are YOUR terminal's own shared pool. A number already claimed by another
//     currently-connected city is "busy" and skipped, like a gate - so two of your own loops can never
//     be running under the same number at once.
//   - Arrival numbers are each city's OWN number, rolled and kept independently of your departure pool
//     and of every other city's arrival number. Two different cities arriving under the same number is
//     fine and expected - same as two real carriers reusing a flight number independently of each other.
//
// Both persist for the life of the run (not re-rolled day to day), and both are reconciled against the
// live purchasedCities list every time they're read: a newly connected city claims a free number (the
// list grows by one); a city disconnected since (e.g. via Amicable Breakups) frees its number straight
// back up (the list shrinks by one), ready for the next city that connects. hyperloop_loop_dep_numbers
// and hyperloop_loop_arr_numbers are wiped alongside the game's other run-scoped aux keys on a prestige
// or a fresh save (see SaveManager.js's AUX_KEYS), so a new run gets fresh numbers rather than inheriting
// the last one's.

import { getCityLoopCode } from '../data/cityLoopCodes.js'

export const DEPARTURE_NUMBERS_KEY = 'hyperloop_loop_dep_numbers'
export const ARRIVAL_NUMBERS_KEY = 'hyperloop_loop_arr_numbers'

const DEPARTURE_NUMBER_MIN = 1
const DEPARTURE_NUMBER_MAX = 999
const ARRIVAL_NUMBER_MIN = 1
const ARRIVAL_NUMBER_MAX = 10

function readMap(key) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || '{}')
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
        return {}
    }
}

function writeMap(key, map) {
    try { localStorage.setItem(key, JSON.stringify(map)) } catch { /* storage full */ }
}

// A random whole number in [min, max] that isn't in `taken`. Falls back to any number in range if every
// one of them is already taken - with at most 999 possible departure numbers and the game's city count
// nowhere near that, this should never actually happen, but it keeps the mechanism from looping forever.
function pickFree(min, max, taken) {
    const span = max - min + 1
    if (taken.size >= span) return min + Math.floor(Math.random() * span)
    let n
    do { n = min + Math.floor(Math.random() * span) } while (taken.has(n))
    return n
}

// Drops any city from `map` that's no longer connected, freeing its number back up. Returns whether
// anything changed, so the caller only writes back to storage when it actually needs to.
function pruneDisconnected(map, connectedNames) {
    let changed = false
    Object.keys(map).forEach(name => {
        if (!connectedNames.has(name)) { delete map[name]; changed = true }
    })
    return changed
}

// Which OTHER currently-connected city (if any) already holds this departure number - a read-only check,
// so the Schedule Loop menu can validate a number the player is still typing before they commit to it
// with setDepartureNumber below.
export function departureNumberConflict(cityName, number, purchasedCities) {
    const connectedNames = new Set((purchasedCities || []).map(c => c.name))
    const map = readMap(DEPARTURE_NUMBERS_KEY)
    const n = Number(number)
    const entry = Object.entries(map).find(([name, num]) => name !== cityName && connectedNames.has(name) && num === n)
    return entry ? entry[0] : null
}

// This city's departure number: assigned once from the shared pool the first time it's needed, then
// reused for the rest of the run.
export function getDepartureNumber(cityName, purchasedCities) {
    const connectedNames = new Set((purchasedCities || []).map(c => c.name))
    const map = readMap(DEPARTURE_NUMBERS_KEY)
    let changed = pruneDisconnected(map, connectedNames)
    if (map[cityName] === undefined) {
        const taken = new Set(Object.values(map))
        map[cityName] = pickFree(DEPARTURE_NUMBER_MIN, DEPARTURE_NUMBER_MAX, taken)
        changed = true
    }
    if (changed) writeMap(DEPARTURE_NUMBERS_KEY, map)
    return map[cityName]
}

// Lets the player manually set a city's departure number from the Schedule Loop menu, in place of the one
// rolled automatically. Refused if it's out of range, or already claimed by another currently-connected
// city - the same busy/free rule getDepartureNumber enforces for its own random pick.
export function setDepartureNumber(cityName, number, purchasedCities) {
    const n = Number(number)
    if (!Number.isInteger(n) || n < DEPARTURE_NUMBER_MIN || n > DEPARTURE_NUMBER_MAX) {
        return { ok: false, error: `Loop number must be between ${String(DEPARTURE_NUMBER_MIN).padStart(3, '0')} and ${DEPARTURE_NUMBER_MAX}.` }
    }
    const conflict = departureNumberConflict(cityName, n, purchasedCities)
    if (conflict) return { ok: false, error: `${conflict} is already using loop number ${String(n).padStart(3, '0')}.` }
    const connectedNames = new Set((purchasedCities || []).map(c => c.name))
    const map = readMap(DEPARTURE_NUMBERS_KEY)
    pruneDisconnected(map, connectedNames)
    map[cityName] = n
    writeMap(DEPARTURE_NUMBERS_KEY, map)
    return { ok: true }
}

// This city's own arrival number: independent of every other city's and of the departure pool above.
export function getArrivalNumber(cityName, purchasedCities) {
    const connectedNames = new Set((purchasedCities || []).map(c => c.name))
    const map = readMap(ARRIVAL_NUMBERS_KEY)
    let changed = pruneDisconnected(map, connectedNames)
    if (map[cityName] === undefined) {
        map[cityName] = ARRIVAL_NUMBER_MIN + Math.floor(Math.random() * (ARRIVAL_NUMBER_MAX - ARRIVAL_NUMBER_MIN + 1))
        changed = true
    }
    if (changed) writeMap(ARRIVAL_NUMBERS_KEY, map)
    return map[cityName]
}

// The code shown to the player for a loop: the city's code plus its departure or arrival number, both
// zero-padded to 3 digits (e.g. "FRA008", "FRA007") so every code reads the same width whichever board
// it's on, even though arrival numbers are drawn from a much smaller range than departure ones.
export function loopCode(cityName, kind, purchasedCities) {
    const prefix = getCityLoopCode(cityName)
    const number = kind === 'arrival' ? getArrivalNumber(cityName, purchasedCities) : getDepartureNumber(cityName, purchasedCities)
    return `${prefix}${String(number).padStart(3, '0')}`
}
