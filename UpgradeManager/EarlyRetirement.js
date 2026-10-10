// Early Retirement: the Rank 100 milestone upgrade. It arrives unlocked rather than owned, and is
// bought with 250 Reputation (not cash). Owning it lets the player prestige from the Prestige page.
import { Upgrade } from "./Upgrade.js";

export const EARLY_RETIREMENT_REP_COST = 250;

export const earlyRetirement = new Upgrade(
    "Early Retirement",
    0,
    "Recreation",
    "earlyRetirement",
    EARLY_RETIREMENT_REP_COST
);
