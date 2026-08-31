
// Port-au-Prince
import { City } from "./City.js";
import { emergencyTraining } from "../UpgradeManager/EmergencyTraining.js";

export const PortAuPrince = new City(
    "Port-au-Prince",
    2600000,
    [emergencyTraining],
    "Haiti",
    "North America",
    2,
    "Port-au-Prince translates to 'Prince's Port' in French, and one leading theory suggests it was named after a ship called Le Prince that arrived in the area in 1706.",
    false
);