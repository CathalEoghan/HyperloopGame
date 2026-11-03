// Flight-number-style codes for loops, mimicking a real departure/arrival board, e.g. "FRA008" for an
// arrival from Frankfurt or "DUB098" for a departure out of a terminal called "Dubai Terminus".
//
// Departures and arrivals use a different PREFIX as well as a different number, on purpose:
//   - A departure's prefix is YOUR terminal's own code (mechanicalLoopCode of its name, e.g. "Dubai
//     Terminus" -> "DUB") - every departure shares it, because they're all loops leaving the same
//     terminal, the same way every real departure board entry at an airport starts with that airport's
//     own code, not the destination's.
//   - An arrival's prefix is the connected city's OWN code (cityLoopCodes.js) - same as today, unchanged.
//
// Numbers follow the same split:
//   - Departure numbers come from YOUR terminal's own shared pool (getDeparturePool below), one slot for
//     every connected city other than home. The pool itself isn't tied to any one city - a number is only
//     claimed once a departure is actually scheduled with it (timetable.js stores the chosen number right
//     on that entry, as `loopNumber`), and it's freed back up the moment that departure is removed, moved
//     to a different number, or its round trip (there, back, and maintenance) is over. That's what lets the
//     Schedule screen offer it as a plain pick-one-from-your-list choice: every pool number not currently
//     out on another scheduled departure's round trip is free to pick, like an unused gate (see
//     timetable.js's busyLoopNumbers for exactly how "out on a round trip" is worked out).
//   - Arrival numbers are each city's OWN number, rolled and kept independently of your departure pool
//     and of every other city's arrival number. Two different cities arriving under the same number is
//     fine and expected - same as two real carriers reusing a flight number independently of each other.
//
// Both persist for the life of the run (not re-rolled day to day). The arrival map is reconciled against
// the live purchasedCities list every time it's read (a newly connected city rolls its own number; one
// disconnected since frees its number back up). The departure pool is reconciled the same way, but by
// size rather than by name, since no city owns a slot in it: it always holds exactly one number per
// connected city other than home, growing or shrinking to match as cities connect or disconnect.
// hyperloop_loop_dep_numbers and hyperloop_loop_arr_numbers are wiped alongside the game's other
// run-scoped aux keys on a prestige or a fresh save (see SaveManager.js's AUX_KEYS), so a new run gets
// fresh numbers rather than inheriting the last one's.

import { getCityLoopCode, mechanicalLoopCode } from '../data/cityLoopCodes.js'

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

// Your terminal's shared departure-number pool: a plain list of unique numbers, one for every connected
// city other than home (connecting a city grows it by one free number to pick from; disconnecting one
// shrinks it back down). None of them belong to any city in particular - see the file header above for
// how a number actually gets claimed. Reconciled against the live purchasedCities list every time it's
// read, so the Schedule screen always offers exactly the right number of choices.
export function getDeparturePool(purchasedCities) {
    const size = Math.max(0, (purchasedCities || []).length - 1)
    let pool
    try {
        const parsed = JSON.parse(localStorage.getItem(DEPARTURE_NUMBERS_KEY) || '[]')
        pool = Array.isArray(parsed) ? [...new Set(parsed.filter(Number.isFinite))] : []
    } catch {
        pool = []
    }
    let changed = false
    if (pool.length > size) { pool = pool.slice(0, size); changed = true }
    while (pool.length < size) {
        pool.push(pickFree(DEPARTURE_NUMBER_MIN, DEPARTURE_NUMBER_MAX, new Set(pool)))
        changed = true
    }
    if (changed) { try { localStorage.setItem(DEPARTURE_NUMBERS_KEY, JSON.stringify(pool)) } catch { /* storage full */ } }
    return pool
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

// The code shown to the player for a loop: a prefix plus its departure or arrival number, both
// zero-padded to 3 digits (e.g. "DUB098", "FRA007") so every code reads the same width whichever board
// it's on, even though arrival numbers are drawn from a much smaller range than departure ones. The
// prefix is the home terminal's own code for a departure (every departure shares it) or the connected
// city's own code for an arrival (see the file header above) - so `terminalName` is only needed for
// departures, and callers rendering only arrivals can omit it. A departure's number isn't looked up here:
// it's whichever one that specific scheduled entry was given (see timetable.js), so the caller passes it
// in directly as `departureNumber` - arrival callers can omit that too.
export function loopCode(cityName, kind, purchasedCities, terminalName, departureNumber) {
    const prefix = kind === 'arrival' ? getCityLoopCode(cityName) : mechanicalLoopCode(terminalName)
    const number = kind === 'arrival' ? getArrivalNumber(cityName, purchasedCities) : (Number.isFinite(departureNumber) ? departureNumber : 0)
    return `${prefix}${String(number).padStart(3, '0')}`
}
