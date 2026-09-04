
// Ljubljana
import { City } from "./City.js";
import { improvedCyclingInfrastructure } from "../UpgradeManager/ImprovedCyclingInfrastructure.js";

export const Ljubljana = new City(
    "Ljubljana",
     500000,
    [improvedCyclingInfrastructure],
    "Slovenia",
    "Europe",
    1,
    "Ljubljana is home to the world’s oldest wooden wheel, which dates back over 5,200 years and was discovered in the local Ljubljana Marshes.",
    false
);