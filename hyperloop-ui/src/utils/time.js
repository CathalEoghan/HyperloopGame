
export function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// A departure is stored as an hour and minute on today's date. Comparing those with the wall clock goes
// wrong on days the clocks change, so they are turned into real moments in time first.
export function departureTimestamp(entry, nowMs = Date.now()) {
    const d = new Date(nowMs)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), entry.hour, entry.minute).getTime()
}

// Whole minutes from now until the departure (negative once it has gone), counted in real minutes.
export function minutesUntilDeparture(entry, nowMs = Date.now()) {
    return Math.round(departureTimestamp(entry, nowMs) / 60000) - Math.floor(nowMs / 60000)
}

// On the night the clocks go forward, an hour of wall-clock time doesn't exist (01:00-01:59 in the UK), so a departure
// placed there really leaves an hour later. Schedules skip those minutes (bug #176).
export function isRealMinute(minuteOfDay, nowMs = Date.now()) {
    const d = new Date(nowMs)
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(minuteOfDay / 60), minuteOfDay % 60)
    return t.getDate() === d.getDate() && t.getHours() * 60 + t.getMinutes() === minuteOfDay
}

// The first real minute at or after this one, in 5-minute steps
export function skipMissingMinutes(minuteOfDay, nowMs = Date.now()) {
    let m = minuteOfDay
    while (m < 24 * 60 && !isRealMinute(m, nowMs)) m += 5
    return m
}
