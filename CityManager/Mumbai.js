
// Mumbai
import { City } from "./City.js";
import { postalOffice } from "../UpgradeManager/PostalOffice.js";

export const Mumbai = new City(
    "Mumbai",
    23000000,
    [postalOffice],
    "India",
    2,
    "Mumbai was originally an archipelago of seven separate islands. British engineers merged them in the 19th century through massive land reclamation projects to form the modern city."
);