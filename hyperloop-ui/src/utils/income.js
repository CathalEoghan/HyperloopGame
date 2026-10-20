// Income is worked out per day (that is what the economy holds), but the game shows it per hour, so a figure on a
// card is easy to compare with a timetable. Only the Progress page keeps to days.
export const HOURS_PER_DAY = 24

export const perHour = amountPerDay => Math.floor(amountPerDay / HOURS_PER_DAY)

// "1,234" for a per-day amount, as per hour
export const formatPerHour = amountPerDay => perHour(amountPerDay).toLocaleString('en-GB', { maximumFractionDigits: 0 })
