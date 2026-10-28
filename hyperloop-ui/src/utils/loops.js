// Loops: the departures and arrivals at the home city, and how long each one takes to travel.
//
// Each day has its own schedules in storage: `departures_<date>` (loops leaving the home city) and `arrivals_<date>`
// (loops reaching it). A loop's travel time comes from the real distance between the two cities and a hyperloop speed
// between 700 and 760 mph, so London to Paris takes about 20 minutes and London to Sydney about 14 hours.
//
// Loops cross midnight, so a few days are kept: yesterday's departures can still be travelling this morning, and
// tomorrow's arrivals have usually set off already this evening.

import cityCoordinates from '../data/cityCoordinates.js'
import { allCities } from '../../../CityManager/CityRegistry.js'
import { skipMissingMinutes, isRealMinute } from './time.js'
import { getPassengerCount } from '../../../Managers/EconomyManager/capacityCurve.js'
import { DEPARTURE_FOOTFALL_HOURS, ARRIVAL_FOOTFALL_MINUTES } from '../../../Managers/EconomyManager/EconomyManager.js'

export const LOOP_MPH_MIN = 700
export const LOOP_MPH_MAX = 760
// Gates a loop can use. A gate isn't reused within 30 minutes of its last loop.
export const NUM_GATES = 30
// An arrival's delay is shorter than a departure's: the loop is already on its way
export const ARRIVAL_DELAY_MAX_MINUTES = 60
// The board shows ARRIVING for the last few minutes before a loop gets in
export const ARRIVING_MINUTES = 10

// How long a farewell or greeting window stays open: 5 minutes, plus 5 for each of the three farewell
// window upgrades owned
export function farewellWindowMinutes(purchasedUpgrades) {
    const extensions = (purchasedUpgrades || []).filter(u => u.effectType === 'farewellWindowExtension').length
    return 5 + extensions * 5
}

const EARTH_RADIUS_MILES = 3958.8
const DAY_KINDS = { departure: 'departures_', arrival: 'arrivals_' }

// ---- Days and storage ----

export const dayKey = (ms = Date.now()) => new Date(ms).toDateString()

// The same time of day, `days` days away. Uses noon, so the clocks changing can't land it on the wrong date.
export function shiftDays(ms, days) {
    const d = new Date(ms)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, 12).getTime()
}

export const scheduleKey = (kind, ms = Date.now()) => `${DAY_KINDS[kind]}${dayKey(ms)}`
export const departuresKey = (ms = Date.now()) => scheduleKey('departure', ms)
export const arrivalsKey = (ms = Date.now()) => scheduleKey('arrival', ms)

export function readSchedule(key) {
    try {
        const list = JSON.parse(localStorage.getItem(key) || '[]')
        return Array.isArray(list) ? list : []
    } catch {
        return []
    }
}

export function writeSchedule(key, list) {
    try { localStorage.setItem(key, JSON.stringify(list)) } catch { /* storage full */ }
}

// Removes every day's schedule that can no longer matter: departures before yesterday, and arrivals before
// yesterday. Yesterday's arrivals have to stay, not just today's and tomorrow's - getTerminalFootfallBreakdown
// (below) deliberately reads yesterday's and today's arrivals together, so a loop that landed just before
// midnight still counts as "people in the terminal" for up to ARRIVAL_FOOTFALL_MINUTES into the new day. Pruning
// yesterday's arrivals away at the same rollover tick that makes them newly relevant silently broke that for the
// whole footfall window every single day.
export function pruneSchedules(nowMs = Date.now()) {
    const keep = new Set([
        departuresKey(shiftDays(nowMs, -1)), departuresKey(nowMs),
        arrivalsKey(shiftDays(nowMs, -1)), arrivalsKey(nowMs), arrivalsKey(shiftDays(nowMs, 1)),
    ])
    Object.keys(localStorage).forEach(key => {
        if ((key.startsWith('departures_') || key.startsWith('arrivals_')) && !keep.has(key)) localStorage.removeItem(key)
    })
}

// ---- Distance and travel time ----

const toRad = deg => deg * Math.PI / 180

// Great-circle distance between two cities, in miles (null when either has no coordinates)
export function distanceMiles(fromName, toName) {
    const a = cityCoordinates[fromName], b = cityCoordinates[toName]
    if (!a || !b) return null
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng)
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
    return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)))
}

// A small, stable hash, so the same loop always gets the same speed without storing it
function hashString(str) {
    let h = 2166136261
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
    return h >>> 0
}

// ---- Passengers ----

const CITY_BY_NAME = new Map(allCities.map(c => [c.name, c]))

// Passengers on board a loop: the destination's tier capacity, at whatever percentage that hour's demand curve
// gives (see capacityCurve.js - the same curve that decides how much the connection actually earns, so the number
// shown here is never out of step with the income it implies).
export function loopPassengers(cityName, hour, seed) {
    const city = CITY_BY_NAME.get(cityName)
    const tier = city ? city.tier : 1
    return getPassengerCount(tier, hour, seed)
}

// A loop's id: the same one the Active Loops list uses, so the list and the passenger total agree
export const loopId = (kind, dayMs, entry) => `${kind === 'arrival' ? 'arr' : 'dep'}|${dayKey(dayMs)}|${entry.time}|${entry.name}`

// A loop's passengers depend on the city, the day and its hour only, never its exact minute, so the Schedule loop
// preview is exactly what runs, and moving a loop within the hour or delaying it doesn't change who is on board
export const stablePassengers = (kind, dayMs, name, hour) => loopPassengers(name, hour, `${kind}|${dayKey(dayMs)}|${name}`)
const passengersOf = (kind, dayMs, entry) => stablePassengers(kind, dayMs, entry.name, entry.hour)

export function loopSpeedMph(seed) {
    return LOOP_MPH_MIN + (hashString(seed) % (LOOP_MPH_MAX - LOOP_MPH_MIN + 1))
}

// Whole minutes a loop takes between two cities. `seed` picks its speed, so each day's loop runs a little differently.
export function tripMinutes(fromName, toName, seed = '') {
    const miles = distanceMiles(fromName, toName)
    if (miles === null) return 60
    return Math.max(5, Math.ceil(miles / loopSpeedMph(`${fromName}>${toName}|${seed}`) * 60))
}

// The travel time of a schedule entry. Entries from before arrivals existed have none stored, so it's worked out.
export function entryDuration(entry, kind, homeName, dayMs) {
    if (Number.isFinite(entry.durationMin)) return entry.durationMin
    return kind === 'arrival'
        ? tripMinutes(entry.name, homeName, `${dayKey(dayMs)}|arrival`)
        : tripMinutes(homeName, entry.name, `${dayKey(dayMs)}|departure`)
}

// ---- Times ----

// The moment an entry's hour and minute happen on the given day
export function entryTimestamp(entry, dayMs = Date.now()) {
    const d = new Date(dayMs)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), entry.hour, entry.minute).getTime()
}

export const timeString = minuteOfDay =>
    `${String(Math.floor(minuteOfDay / 60)).padStart(2, '0')}:${String(minuteOfDay % 60).padStart(2, '0')}`

export function formatClock(ms) {
    const d = new Date(ms)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// "4h 12m", "35m", "under 1m"
export function formatDuration(ms) {
    // Any positive duration under a minute used to round straight up to "1m" (Math.ceil never lands below 1 for
    // ms > 0), so this branch could never actually show - a loop with, say, 30 seconds left just displayed "1m"
    // the same as one with 59 seconds left, and "under 1m" never appeared. Catching the sub-minute case first
    // makes it a real, reachable label instead of dead code.
    if (ms > 0 && ms < 60000) return 'under 1m'
    const totalMinutes = Math.ceil(ms / 60000)
    if (totalMinutes < 1) return 'under 1m'
    const h = Math.floor(totalMinutes / 60), m = totalMinutes % 60
    return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

// ---- Making schedules ----

export function makeEntry(city, minuteOfDay, gate, durationMin) {
    return {
        name: city.name, country: city.country,
        time: timeString(minuteOfDay), hour: Math.floor(minuteOfDay / 60), minute: minuteOfDay % 60,
        minuteOfDay, gate, durationMin,
    }
}

// One day's arrivals: every connected city once, spread through the day. Loops can arrive at the same time as
// long as they use different gates, and a gate isn't reused within 30 minutes of its last use.
export function generateSchedule(purchasedCities, kind, dayMs = Date.now()) {
    const homeCity = purchasedCities[0]
    const cities = purchasedCities.filter(c => !homeCity || c.name !== homeCity.name)
    const picked = [...cities].sort(() => Math.random() - 0.5)
    if (!homeCity || picked.length === 0) return []
    const totalMinutes = 24 * 60
    const gateLastUsed = new Array(NUM_GATES + 1).fill(-Infinity)
    const entries = []
    picked.forEach((city, i) => {
        const slotStart = Math.floor(i * totalMinutes / picked.length)
        const slotEnd = Math.min(Math.floor((i + 1) * totalMinutes / picked.length), totalMinutes - 1)
        let minuteOfDay = Math.floor((slotStart + Math.floor(Math.random() * Math.max(1, slotEnd - slotStart))) / 5) * 5
        // Never exactly 00:00: its farewell window would start on the previous day, so no farewell would open
        minuteOfDay = Math.max(5, minuteOfDay)
        minuteOfDay = skipMissingMinutes(minuteOfDay, dayMs)
        // A slot pushed past the end of the day is left out rather than wrapping round to the morning
        if (minuteOfDay > 23 * 60 + 55) return
        const available = []
        for (let g = 1; g <= NUM_GATES; g++) if (minuteOfDay - gateLastUsed[g] >= 30) available.push(g)
        let gate
        if (available.length > 0) {
            gate = available[Math.floor(Math.random() * available.length)]
        } else {
            let earliest = Infinity
            for (let g = 1; g <= NUM_GATES; g++) if (gateLastUsed[g] < earliest) { earliest = gateLastUsed[g]; gate = g }
        }
        gateLastUsed[gate] = minuteOfDay
        const durationMin = kind === 'arrival'
            ? tripMinutes(city.name, homeCity.name, `${dayKey(dayMs)}|arrival`)
            : tripMinutes(homeCity.name, city.name, `${dayKey(dayMs)}|departure`)
        entries.push(makeEntry(city, minuteOfDay, gate, durationMin))
    })
    return entries.sort((a, b) => a.minuteOfDay - b.minuteOfDay)
}

// Makes today's arrivals, and tomorrow's, where they don't exist yet. Other terminals manage those, so they are
// automatic. Departures come from the player's timetable instead (ensureDepartures, in timetable.js).
export function ensureSchedules(purchasedCities, nowMs = Date.now()) {
    if (!purchasedCities || purchasedCities.length <= 1) return
    const wanted = [
        ['arrival', nowMs],
        ['arrival', shiftDays(nowMs, 1)],
    ]
    wanted.forEach(([kind, dayMs]) => {
        const key = scheduleKey(kind, dayMs)
        if (localStorage.getItem(key)) return
        const list = generateSchedule(purchasedCities, kind, dayMs)
        if (list.length > 0) writeSchedule(key, list)
    })
}

// A city connected during the day gets a loop that sets off from it in 30-60 minutes and arrives today if the trip
// is short enough to get back before the day's cutoff — otherwise the arrival rolls onto tomorrow's board instead,
// rather than vanishing (bug #182). Its departure is not added: the player schedules that.
export function injectCityIntoSchedules(city, purchasedCities, nowMs = Date.now()) {
    const homeCity = purchasedCities[0]
    if (!homeCity || city.name === homeCity.name) return
    const now = new Date(nowMs)
    const currentMins = now.getHours() * 60 + now.getMinutes()
    const lastMins = 23 * 60 + 30

    const place = (kind, earliestMins, durationMin) => {
        let dayMs = nowMs
        let mins = Math.ceil((earliestMins + Math.floor(Math.random() * 30)) / 5) * 5
        // Doesn't fit before today's cutoff: push the whole thing a day later rather than dropping it
        if (mins >= lastMins) { dayMs = shiftDays(nowMs, 1); mins = Math.max(5, mins - 24 * 60) }
        const key = scheduleKey(kind, dayMs)
        const schedule = readSchedule(key)
        if (schedule.some(e => e.name === city.name)) return
        for (let attempts = 0; attempts < 24; attempts++) {
            if (mins <= lastMins && isRealMinute(mins, dayMs)) break
            mins += 5
        }
        if (mins > lastMins) return
        // A gate that hasn't been used within 30 minutes of this time (any gate, if the board is that full)
        const busyGates = new Set(schedule.filter(e => Math.abs((e.hour * 60 + e.minute) - mins) < 30).map(e => e.gate))
        const free = Array.from({ length: NUM_GATES }, (_, i) => i + 1).filter(g => !busyGates.has(g))
        const gate = free.length > 0 ? free[Math.floor(Math.random() * free.length)] : Math.floor(Math.random() * NUM_GATES) + 1
        writeSchedule(key, [...schedule, makeEntry(city, mins, gate, durationMin)].sort((a, b) => a.minuteOfDay - b.minuteOfDay))
    }

    const inbound = tripMinutes(city.name, homeCity.name, `${dayKey(nowMs)}|arrival`)
    place('arrival', currentMins + 30 + inbound, inbound)
    // With no arrivals today yet (the first city connected on a new game), an empty list is kept, so the board
    // doesn't fill in a whole day of arrivals from a city that wasn't connected when they set off
    if (localStorage.getItem(arrivalsKey(nowMs)) === null) writeSchedule(arrivalsKey(nowMs), [])
}

// ---- What's happening now ----

// The board status of an arrival. `lag` (seconds) lets each row flip a moment apart, like a real board.
// `litMinutes` is how long it stays lit as ARRIVED — as long as its greeting can still be open, i.e. the
// player's actual farewell window (farewellWindowMinutes), not a fixed one that assumes every upgrade is owned.
export function getArrivalStatus(entry, homeName, nowMs = Date.now(), lag = 0, litMinutes = 5) {
    const t = nowMs - lag * 1000
    const arriveTs = entryTimestamp(entry, t)
    const startTs = arriveTs - entryDuration(entry, 'arrival', homeName, t) * 60000
    const minutesLeft = (arriveTs - t) / 60000
    if (minutesLeft <= -litMinutes) return { label: 'ARRIVED', color: '#666', gone: true }
    if (minutesLeft <= 0) return { label: 'ARRIVED', color: 'limegreen' }
    if (minutesLeft <= ARRIVING_MINUTES) return { label: 'ARRIVING', color: 'var(--board-accent, #f5a623)' }
    if (entry.delayed) return { label: 'DELAYED', color: '#e74c3c' }
    if (t >= startTs) return { label: 'ON TIME', color: '#7fd4ff' }
    return { label: 'SCHEDULED', color: '#aaa' }
}

// Every loop travelling right now, to or from the home city, soonest to arrive first
export function getActiveLoops(purchasedCities, nowMs = Date.now()) {
    const homeCity = purchasedCities?.[0]
    if (!homeCity) return []
    const connected = new Map(purchasedCities.map(c => [c.name, c]))
    const loops = []
    ;[-1, 0].forEach(offset => {
        const dayMs = offset === 0 ? nowMs : shiftDays(nowMs, offset)
        readSchedule(departuresKey(dayMs)).forEach(e => {
            if (!connected.has(e.name)) return
            const startTs = entryTimestamp(e, dayMs)
            const endTs = startTs + entryDuration(e, 'departure', homeCity.name, dayMs) * 60000
            if (nowMs < startTs || nowMs >= endTs) return
            loops.push({
                id: loopId('departure', dayMs, e), kind: 'departure',
                from: homeCity.name, fromCountry: homeCity.country, to: e.name, toCountry: e.country,
                startTs, endTs, delayed: !!e.delayed, passengers: passengersOf('departure', dayMs, e),
            })
        })
    })
    ;[0, 1].forEach(offset => {
        const dayMs = offset === 0 ? nowMs : shiftDays(nowMs, offset)
        readSchedule(arrivalsKey(dayMs)).forEach(e => {
            if (!connected.has(e.name)) return
            const endTs = entryTimestamp(e, dayMs)
            const startTs = endTs - entryDuration(e, 'arrival', homeCity.name, dayMs) * 60000
            if (nowMs < startTs || nowMs >= endTs) return
            loops.push({
                id: loopId('arrival', dayMs, e), kind: 'arrival',
                from: e.name, fromCountry: e.country, to: homeCity.name, toCountry: homeCity.country,
                startTs, endTs, delayed: !!e.delayed, passengers: passengersOf('arrival', dayMs, e),
            })
        })
    })
    return loops.sort((a, b) => a.endTs - b.endTs)
}

// DEPARTURE_FOOTFALL_HOURS and ARRIVAL_FOOTFALL_MINUTES (imported above) live in EconomyManager.js, since
// getDevelopmentBusyExplanation spells them out in the busy-status tooltip - this keeps one source of truth
// instead of two copies that could drift apart.

// How many loops are putting people in the home terminal right now, for the development busy bonus, split by
// which side of the board they're on - so the UI can explain the number (e.g. "2 loops nearing departure, 1 just
// arrived") rather than just showing a bare count. A departure counts from DEPARTURE_FOOTFALL_HOURS before it
// leaves (people arriving early, going through security) up to the moment it leaves; an arrival counts for
// ARRIVAL_FOOTFALL_MINUTES after it lands (collecting bags, deciding where to go). A loop actually in transit
// between the two counts for neither - its passengers aren't in the building.
export function getTerminalFootfallBreakdown(purchasedCities, nowMs = Date.now()) {
    const homeCity = purchasedCities?.[0]
    if (!homeCity) return { departures: 0, arrivals: 0, total: 0 }
    const connected = new Map(purchasedCities.map(c => [c.name, c]))
    let departures = 0
    const departureWindowMs = DEPARTURE_FOOTFALL_HOURS * 60 * 60000
    ;[0, 1].forEach(offset => {
        const dayMs = offset === 0 ? nowMs : shiftDays(nowMs, offset)
        readSchedule(departuresKey(dayMs)).forEach(e => {
            if (!connected.has(e.name)) return
            const departTs = entryTimestamp(e, dayMs)
            if (departTs >= nowMs && departTs - nowMs <= departureWindowMs) departures++
        })
    })
    let arrivals = 0
    const arrivalWindowMs = ARRIVAL_FOOTFALL_MINUTES * 60000
    ;[-1, 0].forEach(offset => {
        const dayMs = offset === 0 ? nowMs : shiftDays(nowMs, offset)
        readSchedule(arrivalsKey(dayMs)).forEach(e => {
            if (!connected.has(e.name)) return
            const arriveTs = entryTimestamp(e, dayMs)
            if (arriveTs <= nowMs && nowMs - arriveTs <= arrivalWindowMs) arrivals++
        })
    })
    return { departures, arrivals, total: departures + arrivals }
}

// How many loops are putting people in the home terminal right now, for the development busy bonus (see
// getTerminalFootfallBreakdown for the departure/arrival split behind this number).
export function getTerminalFootfallCount(purchasedCities, nowMs = Date.now()) {
    return getTerminalFootfallBreakdown(purchasedCities, nowMs).total
}


// ---- Totals ----

const COUNTED_KEY = 'hyperloop_loop_counted'

// A day's schedule: how many loops it holds, and how many ran after `afterMs` and by `nowMs`. Only cities still
// connected count: a disconnected city's arrivals stay in the stored schedule but never run (nor show anywhere).
function scheduledBetween(kind, dayMs, afterMs, nowMs, homeName, connected) {
    const list = readSchedule(scheduleKey(kind, dayMs))
    const ranList = list.filter(e => {
        if (connected && !connected.has(e.name)) return false
        const t = entryTimestamp(e, dayMs)
        return t > afterMs && t <= nowMs
    })
    const passengers = ranList.reduce((sum, e) => sum + passengersOf(kind, dayMs, e), 0)
    const miles = ranList.reduce((sum, e) => sum + (distanceMiles(homeName, e.name) || 0), 0)
    return { total: list.length, ran: ranList.length, passengers, miles, known: list.length > 0 }
}

// Counts the departures and arrivals that have happened since the last time this ran, including the ones while the
// game was closed, and returns how many are new: { departure, arrival }.
// It remembers the moment it last counted (not how many it had counted), so a city disconnected or connected during
// the day, or a fresh run after a prestige, can't make it count a loop twice or skip one. Schedules are stored per
// day, so a day whose schedule has since been cleared away (a long time away) counts as a full day of the loops a
// schedule would have had. The first run only starts the count, and nothing is counted while only the home city is
// connected (there are no loops then).
export function tallyLoops(purchasedCities, nowMs = Date.now()) {
    const result = { departure: 0, arrival: 0, passengers: 0, miles: 0 }
    let state = {}
    try { state = JSON.parse(localStorage.getItem(COUNTED_KEY) || '{}') || {} } catch { state = {} }
    const hasLoops = !!purchasedCities && purchasedCities.length > 1
    const today = dayKey(nowMs)
    const perDay = hasLoops ? purchasedCities.length - 1 : 0
    // Arrivals come from every connected city; departures only from the ones on the player's timetable
    let departuresPerDay = perDay
    try {
        const names = new Set((purchasedCities || []).map(c => c.name))
        const table = JSON.parse(localStorage.getItem('hyperloop_timetable') || '[]')
        if (Array.isArray(table)) departuresPerDay = hasLoops ? table.filter(e => e && names.has(e.name) && e.name !== purchasedCities[0].name).length : 0
    } catch { /* keep the estimate */ }
    // For days whose schedule is gone: the passengers an average loop to one of the connected cities would carry
    const others = hasLoops ? purchasedCities.slice(1) : []
    // A day whose schedule is gone has no real hour to look up, so this estimate uses noon (a representative,
    // roughly-average hour) rather than the exact one any particular vanished loop actually ran at.
    const estimateHour = 12
    const averagePassengers = others.length
        ? others.reduce((sum, c) => sum + loopPassengers(c.name, estimateHour, `estimate|${c.name}`), 0) / others.length : 0
    const homeName = hasLoops ? purchasedCities[0].name : ''
    const connected = new Set((purchasedCities || []).map(c => c.name))
    const averageMiles = others.length
        ? others.reduce((sum, c) => sum + (distanceMiles(homeName, c.name) || 0), 0) / others.length : 0
    ;['departure', 'arrival'].forEach(kind => {
        const previous = state[kind]
        const lastMs = previous && Number.isFinite(previous.t) ? Math.min(previous.t, nowMs) : null
        if (hasLoops && lastMs !== null) {
            let gained = 0
            let dayMs = shiftDays(lastMs, 0)
            // Each day from the last count up to and including today (limited to a year)
            for (let i = 0; i < 367; i++) {
                const isToday = dayKey(dayMs) === today
                const isLastDay = dayKey(dayMs) === dayKey(lastMs)
                const day = scheduledBetween(kind, dayMs, lastMs, nowMs, homeName, connected)
                if (day.known) {
                    gained += day.ran
                    result.passengers += day.passengers
                    result.miles += day.miles
                } else if (!isToday) {
                    // The schedule is gone: what was left of it when last seen, or a full day's worth
                    const loops = isLastDay ? (Number.isFinite(previous.left) ? previous.left : 0) : (kind === 'departure' ? departuresPerDay : perDay)
                    gained += loops
                    result.passengers += Math.round(loops * averagePassengers)
                    result.miles += loops * averageMiles
                }
                if (isToday) break
                dayMs = shiftDays(dayMs, 1)
            }
            result[kind] = gained
        }
        // Remember the moment, and how many of today's loops are still to come in case today's schedule is gone later
        const todayLeft = scheduledBetween(kind, nowMs, nowMs, Infinity, homeName, connected).ran
        state[kind] = { t: nowMs, left: todayLeft }
    })
    try { localStorage.setItem(COUNTED_KEY, JSON.stringify(state)) } catch { /* storage full */ }
    return result
}
