
// Oslo
import { City } from "./City.js";
import { energyEfficiencyImprovements } from "../UpgradeManager/EnergyEfficiencyImprovements.js";

export const Oslo = new City(
    "Oslo",
    1500000,
    [energyEfficiencyImprovements],
    "Norway",
    "Europe",
    2,
    "Nearly half of Oslo's geographical area is made up of untouched forests and protected nature, meaning you are never more than 15 minutes away from the wilderness.",
    false
);