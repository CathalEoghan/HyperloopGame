// The departure timetable: which city leaves the home city, at what time and from which gate, every day.
//
// The player builds it (Schedule loop) or lets the game fill it in (Automate schedule). It is saved, and each day's
// departures (`departures_<date>`, which the farewells, delays, globe and totals all read) are made from it when the
// day starts. Changing it also changes today's departures that haven't left yet. Arrivals are not part of this: other
// terminals manage those, so they stay on their own automatic timetable (see loops.js).
//
// A timetable entry is { name, country, minuteOfDay, gate }: one departure a day per city.

import {
    NUM_GATES, SCHEDULE_CAP, dayKey, departuresKey, readSchedule, writeSchedule, entryTimestamp, tripMinutes,
    makeEntry, timeString, formatClock, stablePassengers,
} from './loops.js'
import { isRealMinute } from './time.js'

export const TIMETABLE_KEY = 'hyperloop_timetable'
// Departures are at least this many minutes apart, and a gate can't be used again within GATE_COOLDOWN of its last use
export const MIN_SPACING = 10
export const GATE_COOLDOWN = 30
// A loop that is due in less than this long is locked for today (it is boarding): changes to it start tomorrow
export const MIN_LEAD = 15
export const FIRST_MINUTE = 5            // never exactly 00:00: its farewell window would start on the previous day
export const LAST_MINUTE = 23 * 60 + 55

// ---- Storage ----

const isSlot = e => e && typeof e.name === 'string' && Number.isFinite(e.minuteOfDay) && Number.isFinite(e.gate)

function toMinuteOfDay(hhmm) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '')
    return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

// Games from before the timetable existed: the most recent day of departures they have becomes their timetable
function migrateFromStoredDay() {
    let bestKey = null, bestTime = -Infinity
    Object.keys(localStorage).forEach(key => {
        if (!key.startsWith('departures_')) return
        const t = Date.parse(key.slice('departures_'.length))
        if (Number.isFinite(t) && t > bestTime) { bestTime = t; bestKey = key }
    })
    if (!bestKey) return null
    const slots = []
    readSchedule(bestKey).forEach(e => {
        // A delayed departure goes back to the time it was meant to leave
        const minuteOfDay = toMinuteOfDay(e.originalTime) ?? e.minuteOfDay
        if (Number.isFinite(minuteOfDay) && Number.isFinite(e.gate) && !slots.some(s => s.name === e.name)) {
            slots.push({ name: e.name, country: e.country, minuteOfDay, gate: e.gate })
        }
    })
    return slots
}

export function readTimetable() {
    let list
    try { list = JSON.parse(localStorage.getItem(TIMETABLE_KEY)) } catch { list = null }
    if (!Array.isArray(list)) {
        const migrated = migrateFromStoredDay()
        if (!migrated) return []
        writeTimetable(migrated)
        list = migrated
    }
    return list.filter(isSlot).sort((a, b) => a.minuteOfDay - b.minuteOfDay)
}

export function writeTimetable(list) {
    try { localStorage.setItem(TIMETABLE_KEY, JSON.stringify(list)) } catch { /* storage full */ }
}

// The connected cities (other than the home city) with no departure scheduled
export function unscheduledCities(purchasedCities, timetable = readTimetable()) {
    const home = purchasedCities?.[0]
    const taken = new Set(timetable.map(e => e.name))
    return (purchasedCities || []).filter(c => (!home || c.name !== home.name) && !taken.has(c.name))
}

// ---- Rules ----

// Minutes between two times of day. The timetable repeats every day, so 23:40 and 00:05 are 25 minutes apart.
const gapBetween = (a, b) => {
    const d = Math.abs(a - b)
    return Math.min(d, 24 * 60 - d)
}

// null when the slot is allowed, otherwise a sentence saying why not. `name` may already be on the timetable
// (moving it): its own entry is ignored.
export function slotProblem(timetable, { name, minuteOfDay, gate }, nowMs = Date.now()) {
    if (!Number.isInteger(minuteOfDay) || minuteOfDay % 5 !== 0 || minuteOfDay < FIRST_MINUTE || minuteOfDay > LAST_MINUTE) {
        return 'Departures run between 00:05 and 23:55, on the 5 minutes.'
    }
    if (!isRealMinute(minuteOfDay, nowMs)) return "That time doesn't exist today, as the clocks change."
    if (!Number.isInteger(gate) || gate < 1 || gate > NUM_GATES) return `Gates are numbered 1 to ${NUM_GATES}.`
    const others = timetable.filter(e => e.name !== name)
    if (others.length >= SCHEDULE_CAP) return `A timetable holds at most ${SCHEDULE_CAP} departures.`
    const tooClose = others.find(e => gapBetween(e.minuteOfDay, minuteOfDay) < MIN_SPACING)
    if (tooClose) return `Too close to ${tooClose.name} at ${timeString(tooClose.minuteOfDay)}: departures need ${MIN_SPACING} minutes between them.`
    const gateClash = others.find(e => e.gate === gate && gapBetween(e.minuteOfDay, minuteOfDay) < GATE_COOLDOWN)
    if (gateClash) return `Gate ${gate} is in use for ${gateClash.name} at ${timeString(gateClash.minuteOfDay)}. A gate needs ${GATE_COOLDOWN} minutes between loops.`
    return null
}

// Which gates can't be used for this city at this time, as { gate: 'why' }
export function busyGates(timetable, name, minuteOfDay) {
    const busy = {}
    timetable.filter(e => e.name !== name).forEach(e => {
        if (gapBetween(e.minuteOfDay, minuteOfDay) < GATE_COOLDOWN) busy[e.gate] = `${e.name} at ${timeString(e.minuteOfDay)}`
    })
    return busy
}

// ---- What a loop would do ----

// Used by the Schedule loop screen: when it should arrive (leaving out any delay) and how many passengers to expect.
// Both are worked out the way the real loop's are, so the preview is what happens.
export function previewLoop(homeName, name, minuteOfDay, nowMs = Date.now()) {
    const durationMin = tripMinutes(homeName, name, `${dayKey(nowMs)}|departure`)
    const departTs = entryTimestamp({ hour: Math.floor(minuteOfDay / 60), minute: minuteOfDay % 60 }, nowMs)
    const arriveTs = departTs + durationMin * 60000
    const nextDay = new Date(arriveTs).getDate() !== new Date(departTs).getDate()
    return {
        durationMin,
        arriveClock: formatClock(arriveTs),
        nextDay,
        passengers: stablePassengers('departure', nowMs, name),
    }
}

// ---- Today's departures ----

const entryFor = (slot, home, nowMs) => makeEntry(
    { name: slot.name, country: slot.country }, slot.minuteOfDay, slot.gate,
    tripMinutes(home.name, slot.name, `${dayKey(nowMs)}|departure`),
)

// Makes today's departures from the timetable, if the day doesn't have them yet
export function ensureDepartures(purchasedCities, nowMs = Date.now()) {
    if (!purchasedCities || purchasedCities.length <= 1) return
    const key = departuresKey(nowMs)
    if (localStorage.getItem(key) !== null) return
    const home = purchasedCities[0]
    const countries = new Map(purchasedCities.map(c => [c.name, c.country]))
    const list = readTimetable()
        .filter(e => e.name !== home.name && countries.has(e.name) && isRealMinute(e.minuteOfDay, nowMs))
        .map(e => entryFor({ ...e, country: countries.get(e.name) }, home, nowMs))
    writeSchedule(key, list)
}

// Applies one city's timetable change (slot, or null for taking it off) to today's departures, as far as today allows.
// Returns true when today's departure now matches the slot.
function syncToday(name, slot, purchasedCities, nowMs) {
    const home = purchasedCities?.[0]
    const key = departuresKey(nowMs)
    if (!home || localStorage.getItem(key) === null) return false
    let list = readSchedule(key)
    const existing = list.find(e => e.name === name)
    // Already boarding, or gone: it stays as it is today
    if (existing && entryTimestamp(existing, nowMs) - nowMs < MIN_LEAD * 60000) return false
    list = list.filter(e => e.name !== name)
    let applied = false
    if (slot) {
        const due = entryTimestamp({ hour: Math.floor(slot.minuteOfDay / 60), minute: slot.minuteOfDay % 60 }, nowMs)
        // Today's list can differ from the timetable (a delay moves a loop), so it is checked too
        const clash = list.some(e => gapBetween(e.minuteOfDay, slot.minuteOfDay) < MIN_SPACING
            || (e.gate === slot.gate && gapBetween(e.minuteOfDay, slot.minuteOfDay) < GATE_COOLDOWN))
        if (due - nowMs >= MIN_LEAD * 60000 && !clash && isRealMinute(slot.minuteOfDay, nowMs)) {
            list.push(entryFor(slot, home, nowMs))
            applied = true
        }
    }
    writeSchedule(key, list.sort((a, b) => a.minuteOfDay - b.minuteOfDay))
    return applied
}

// ---- Changing the timetable ----

// Adds a city to the timetable, or moves it. Returns { ok: false, error } or { ok: true, today }, where `today` says
// whether today's departure was set (false: it was too soon or had gone, so the change starts tomorrow).
export function saveSlot(slot, purchasedCities, nowMs = Date.now()) {
    ensureDepartures(purchasedCities, nowMs)
    const timetable = readTimetable()
    const error = slotProblem(timetable, slot, nowMs)
    if (error) return { ok: false, error }
    const home = purchasedCities?.[0]
    if (!home || slot.name === home.name || !purchasedCities.some(c => c.name === slot.name)) {
        return { ok: false, error: 'That city is not connected.' }
    }
    const country = purchasedCities.find(c => c.name === slot.name).country
    const next = { name: slot.name, country, minuteOfDay: slot.minuteOfDay, gate: slot.gate }
    writeTimetable([...timetable.filter(e => e.name !== slot.name), next])
    return { ok: true, today: syncToday(slot.name, next, purchasedCities, nowMs) }
}

export function removeSlot(name, purchasedCities, nowMs = Date.now()) {
    ensureDepartures(purchasedCities, nowMs)
    writeTimetable(readTimetable().filter(e => e.name !== name))
    syncToday(name, null, purchasedCities, nowMs)
}

// A disconnected city leaves the timetable (its loops still to come are taken off today's departures by the caller)
export function dropCityFromTimetable(name) {
    writeTimetable(readTimetable().filter(e => e.name !== name))
}

// ---- Automate ----

const shuffle = list => {
    const a = [...list]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// A random free time and gate for a city, preferring the rest of today over tomorrow
function pickSlot(timetable, name, nowMs) {
    const now = new Date(nowMs)
    const earliestToday = now.getHours() * 60 + now.getMinutes() + MIN_LEAD
    const minutes = []
    for (let m = FIRST_MINUTE; m <= LAST_MINUTE; m += 5) minutes.push(m)
    const rest = shuffle(minutes.filter(m => m >= earliestToday))
    const earlier = shuffle(minutes.filter(m => m < earliestToday))
    for (const minuteOfDay of [...rest, ...earlier]) {
        for (const gate of shuffle(Array.from({ length: NUM_GATES }, (_, i) => i + 1))) {
            if (!slotProblem(timetable, { name, minuteOfDay, gate }, nowMs)) return { minuteOfDay, gate }
        }
    }
    return null
}

// Gives every unscheduled city a random free time and gate. Cities already on the timetable are left alone.
// Returns { added: [slots], skipped: number of cities with no room left }.
export function automateTimetable(purchasedCities, nowMs = Date.now()) {
    ensureDepartures(purchasedCities, nowMs)
    const timetable = readTimetable()
    const added = []
    let skipped = 0
    shuffle(unscheduledCities(purchasedCities, timetable)).forEach(city => {
        const found = pickSlot(timetable, city.name, nowMs)
        if (!found) { skipped += 1; return }
        const slot = { name: city.name, country: city.country, ...found }
        timetable.push(slot)
        added.push(slot)
    })
    if (added.length > 0) {
        writeTimetable(timetable)
        added.forEach(slot => syncToday(slot.name, slot, purchasedCities, nowMs))
    }
    return { added, skipped }
}
