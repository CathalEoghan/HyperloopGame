
// Malé
import { City } from "./City.js";
import { summerHolidayPackages } from "../UpgradeManager/SummerHolidayPackages.js";

export const Malé = new City(
    "Malé",
    300000,
    [summerHolidayPackages],
    "Maldives",
    "Asia",
    1,
    "Because the city ran out of space, engineers built an entire nearby artificial island called Hulhumale to ease the crowding.",
    false
);