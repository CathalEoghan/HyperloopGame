
// Experimental Technology
import { Upgrade } from '../UpgradeManager/Upgrade.js'

// How many times this has ever been claimed, across every run - ProgressionManager's own
// LIFETIME_EXPTECH_CLAIMS_KEY, read directly here (rather than through ProgressionManager, which this file
// can't import without a circular dependency) since it's the one thing the tier below is driven by.
function claimsSoFar() {
    try {
        const v = Number(localStorage.getItem('hyperloop_lifetime_exptech_claims'))
        return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0
    } catch { return 0 }
}

// Doubles every time it's claimed, however many runs apart: 10 Prestige Points for £10,000,000 the first time,
// 20 for £20,000,000 the next, 40 for £40,000,000 after that, and so on forever - always a flat £1,000,000 per
// Prestige Point (Bank's build discount doesn't apply to it - see EconomyManager.isBuildDiscountExempt). Unlike every other source of Prestige Points (rank, lifetime cash), this is meant to keep
// paying out at a scale that matters deep into a very dedicated player's save, rather than becoming cheaper and
// cheaper to ignore as the economy grows past its original, static price.
const PP_PER_TIER_BASE = 10
const CASH_PER_PRESTIGE_POINT = 1000000

export const experimentalTechnology = new Upgrade(
    "Experimental Technology",
    0,
    "Enterprise",
    "prestigePoints",
    0
);

// cost and effectValue are read all over the UI (the build list, the detail modal, the bulk-buy planner) the
// same way every other Development/Upgrade's are, so turning them into live getters - rather than a dedicated
// method elsewhere - means every one of those call sites shows and charges the current tier with no changes of
// its own. ProgressionManager.purchaseDevelopment is the only place that ever advances the tier (via
// claimExperimentalTechnology, once the Prestige Points above have actually been paid out).
Object.defineProperty(experimentalTechnology, 'effectValue', {
    get() { return PP_PER_TIER_BASE * Math.pow(2, claimsSoFar()) },
    set() { /* read-only: the tier is driven entirely by the lifetime claim count above */ },
});
Object.defineProperty(experimentalTechnology, 'cost', {
    get() { return this.effectValue * CASH_PER_PRESTIGE_POINT },
    set() { /* read-only, see effectValue above */ },
});
