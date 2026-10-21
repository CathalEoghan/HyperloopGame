// The demand curve a departure runs on through the day, and how many passengers that means.
//
// Every departure has a capacity (the most passengers its destination's tier could ever carry) and runs at some
// percentage of it: a 50% floor, plus a bonus that depends on the hour, rolled once per city/day/hour so the same
// loop always shows the same number (moving it or delaying it never changes who's on board, the same idea as
// loopPassengers used to follow on its own). This one curve is the single source of truth for passenger counts
// everywhere they're shown (the departure/arrival board, the Schedule loop preview, Active Loops) and for how much
// a connection actually earns while it runs (see EconomyManager.getConnectionCapacityMultiplier).
//
// Development income uses a different, unrelated formula (how many loops are on the board right now), see
// EconomyManager.getDevelopmentBusyMultiplier.

// The most passengers a departure could ever carry, by the destination's tier. Tier 0 is the secret Antarctic
// Peninsula - a research base, never more than a couple of dozen people through it at once.
export const TIER_CAPACITY = { 0: 20, 1: 250, 2: 750, 3: 1250 };

export const CAPACITY_FLOOR_PCT = 50;

// The day's demand bands, covering all 24 hours with no gaps (Night runs 10pm-2am, so Dawn can pick up at 2am).
// Each is [startHour, endHour) in 24-hour local time, with endHour allowed to run past 24 (Night wraps to 26,
// i.e. 2am the next day) - getDemandBand below folds an early-morning hour into that range before matching.
export const DEMAND_BANDS = [
    { name: 'Dawn',      startHour: 2,  endHour: 6,  min: 0,  max: 5 },
    { name: 'Sunrise',   startHour: 6,  endHour: 8,  min: 5,  max: 20 },
    { name: 'Morning',   startHour: 8,  endHour: 10, min: 20, max: 30 },
    { name: 'Forenoon',  startHour: 10, endHour: 12, min: 25, max: 35 },
    { name: 'Afternoon', startHour: 12, endHour: 16, min: 35, max: 50 },
    { name: 'Dusk',      startHour: 16, endHour: 18, min: 35, max: 45 },
    { name: 'Evening',   startHour: 18, endHour: 22, min: 30, max: 40 },
    { name: 'Night',     startHour: 22, endHour: 26, min: 15, max: 25 },
];

export function getTierCapacity(tier) {
    return TIER_CAPACITY[tier] ?? TIER_CAPACITY[1];
}

// The band a given hour (0-23) falls in. Hours before 2am are folded onto the end of the clock (1am -> 25) so they
// match Night's wraparound range instead of falling through every band.
export function getDemandBand(hour) {
    const h = hour < 2 ? hour + 24 : hour;
    return DEMAND_BANDS.find(b => h >= b.startHour && h < b.endHour) || DEMAND_BANDS[DEMAND_BANDS.length - 1];
}

// A small, stable hash so the same seed always gives the same roll (kept local rather than imported from
// utils/loops.js, so this file - used by the plain EconomyManager class - never has to import from the UI layer).
function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
}

// The capacity a loop runs at (50-100), stable for a given hour and seed.
export function getCapacityPercent(hour, seed) {
    const band = getDemandBand(hour);
    const roll = hashString(`${seed}|capacity`) / 4294967296;
    const bonus = band.min + roll * (band.max - band.min);
    return Math.min(100, CAPACITY_FLOOR_PCT + bonus);
}

export function getCapacityMultiplier(hour, seed) {
    return getCapacityPercent(hour, seed) / 100;
}

export function getPassengerCount(tier, hour, seed) {
    return Math.round(getTierCapacity(tier) * getCapacityMultiplier(hour, seed));
}
