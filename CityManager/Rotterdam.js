
// Rotterdam
import { City } from "./City.js";
import { shippingPort } from "../UpgradeManager/ShippingPort.js";

export const Rotterdam = new City(
    "Rotterdam",
    2500000,
    [shippingPort],
    "The Netherlands",
    "Europe",
    2,
    "Around 90% of Rotterdam lies below sea level, protected by a massive system of dikes, levees, and dams.",
    false
);