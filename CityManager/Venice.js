
// Venice
import { City } from "./City.js";
import { waterTaxiTransfers } from "../UpgradeManager/WaterTaxiTransfers.js";

export const Venice = new City(
    "Venice",
    2600000,
    [waterTaxiTransfers],
    "Italy",
    "Europe",
    2,
    "At its tightest point, Calle Varisco (near Campo San Canciano) is only 53 cm (about 21 inches) wide, making it one of the narrowest alleys in the entire world."
);