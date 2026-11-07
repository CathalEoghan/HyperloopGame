// The two numbers that several parts of the game have to agree on, kept in one place so they can't drift apart:
//
//  - STARTING_BALANCE: what every new run begins with (ProgressionManager), and so what the save checker has to
//    allow a balance to be above the cash earned (SaveManager).
//  - TIER_CONNECTION_COST: what it costs to connect a city, by tier (ConstructionManager). Line upgrades are priced
//    off the same table (ProgressionManager), as a multiple of it, and a disconnect costs half of it.
//
// How the tier prices were set: a city's base income runs roughly 1 : 5 : 10 across tiers 1, 2 and 3 (an average
// £8k, £42k and £85k an hour), so prices at 1 : 5 : 15 pay back in about 6h for Tier 1 and 2 and 9h for Tier 3. Tier 3
// used to be priced at 1 : 5 : 20 (1,000,000), twice the payback of the others, which made a Tier 3 pick feel like a
// trap for a new player. Developments pay back in about 7h, so cities now sit level with them or a little behind.
export const STARTING_BALANCE = 1_500_000

// Tier 0 is the secret Antarctic Peninsula finale
export const TIER_CONNECTION_COST = { 0: 2_500_000, 1: 50_000, 2: 250_000, 3: 750_000 }
