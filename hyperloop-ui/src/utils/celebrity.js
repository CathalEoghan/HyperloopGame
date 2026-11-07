import { departureTimestamp } from './time.js'

// How far ahead a Celebrity Sighting looks for the departure the celebrity is travelling on
export const CELEBRITY_LOOKAHEAD_HOURS = 6

// Picks that departure from today's schedule: one that leaves within CELEBRITY_LOOKAHEAD_HOURS and whose farewell
// window hasn't opened yet (a farewell already offered can't be made a VIP any more). Returns its key, in the form the
// tick uses (`${todayKey}_${time}_${city}`), or null when nothing qualifies - a young terminal, or a quiet end of the day.
export function pickCelebrityDeparture(schedule, { nowMs, todayKey, farewellWindowMs, alreadyTriggered, random = Math.random }) {
    const candidates = (schedule || []).filter(entry => {
        const depTs = departureTimestamp(entry, nowMs)
        return depTs - farewellWindowMs > nowMs
            && depTs <= nowMs + CELEBRITY_LOOKAHEAD_HOURS * 3600000
            && !alreadyTriggered.has(`${todayKey}_${entry.time}_${entry.name}`)
    })
    if (candidates.length === 0) return null
    const pick = candidates[Math.floor(random() * candidates.length)]
    return `${todayKey}_${pick.time}_${pick.name}`
}
