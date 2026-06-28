
// Bogotá
import { City } from "./City.js";
import { busTransfers } from "../UpgradeManager/BusTransfers.js";

export const Bogotá = new City(
    "Bogotá",
    11900000,
    [busTransfers],
    "Colombia",
    "South America",
    2,
    "At 2,640 meters (8,661 feet) above sea level, Bogotá is the world's third-highest capital city, sitting in a basin that was actually a massive lake until it drained roughly 30,000 years ago."
);