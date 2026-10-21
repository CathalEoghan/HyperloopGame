
// Novosibirsk
import { City } from "./City.js";
import { lostAndFoundOffice } from "../UpgradeManager/LostAndFoundOffice.js";

export const Novosibirsk = new City(
    "Novosibirsk",
    1630000,
    [lostAndFoundOffice],
    "Russia",
    "Asia",
    2,
    "Novosibirsk didn't exist until 1893, founded as a construction camp for a Trans-Siberian Railway bridge over the River Ob - it grew so fast it passed a million people within about 70 years, one of the quickest such milestones in history.",
    false
);
