// Livestream Everything and Streaming Mastery: a guaranteed Reputation bonus for manual Work clicks.
// The count is of this run's manual clicks only (Best P.A. Ever's own presses are not counted), kept under its own key
// so it starts again with every new run. The Work button's total on the Progress page is a separate, lifetime count.
import { PRESTIGE_VALUES as V } from './prestigeUpgrades.js'

export const LIVESTREAM_KEY = 'hyperloop_livestream_clicks'

// How often the bonus is paid and how much it is, or null without Livestream Everything.
// `owns` is a function from an upgrade id to true or false.
export function livestreamSettings(owns) {
    if (!owns('livestreamEverything')) return null
    const mastery = owns('streamingMastery')
    return {
        every: mastery ? V.streamingMasteryEvery : V.livestreamEvery,
        rep: V.livestreamRep * (mastery ? V.streamingMasteryFactor : 1),
    }
}

// The Reputation due now that this run's manual click count has reached `count` (0 on most clicks)
export function livestreamRepFor(count, owns) {
    const s = livestreamSettings(owns)
    return s && count > 0 && count % s.every === 0 ? s.rep : 0
}

export function readLivestreamClicks() {
    try {
        const n = JSON.parse(localStorage.getItem(LIVESTREAM_KEY))
        return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
    } catch { return 0 }
}

// Counts one manual click and returns the run's new total
export function bumpLivestreamClicks() {
    const n = readLivestreamClicks() + 1
    try { localStorage.setItem(LIVESTREAM_KEY, JSON.stringify(n)) } catch { /* storage full: the count just stalls */ }
    return n
}
