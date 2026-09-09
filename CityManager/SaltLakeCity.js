
// Salt Lake City
import { City } from "./City.js";
import { trafficManagementStrategy } from "../UpgradeManager/TrafficManagementStrategy.js";

export const SaltLakeCity = new City(
    "Salt Lake City",
    1300000,
    [trafficManagementStrategy],
    "United States of America",
    "North America",
    2,
    "Salt Lake City's famous grid-style downtown streets were originally built extra wide - measuring a massive 132 feet across - so that a team of oxen and a covered wagon could easily perform a U-turn.",
    false
);