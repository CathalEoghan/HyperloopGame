
// Moscow
import { City } from "./City.js";
import { integratedMetroSystem } from "../UpgradeManager/IntegratedMetroSystem.js";

export const Moscow = new City(
    "Moscow",
    21500000,
    [integratedMetroSystem],
    "Russia",
    "Europe",
    3,
    "Moscow's vast transit network features an unusual commuting group: some local stray dogs have learned to navigate the city's subway system. They use their sense of smell and hearing to board specific trains, occasionally nap, and get off at designated stations known for food scraps.",
    false
);