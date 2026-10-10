// Anniversary Sales: the Rank 25 milestone upgrade. +5% work earnings for every unique
// achievement unlocked (see EconomyManager.getUniqueAchievementCount; 0 until Achievements exist).
import { Upgrade } from "./Upgrade.js";

export const anniversarySales = new Upgrade(
    "Anniversary Sales",
    0,
    "Recreation",
    "workPerAchievement",
    0.05
);
