
// Tirana
import { City } from "./City.js";
import { serviceDeliveryTraining } from "../UpgradeManager/ServiceDeliveryTraining.js";

export const Tirana = new City(
    "Tirana",
    700000,
    [serviceDeliveryTraining],
    "Albania",
    "Europe",
    1,
    "Tirana was transformed from a gray communist city into a vibrant outdoor art gallery when its former mayor (who was an artist) had dull residential buildings painted in bright, bold colors and patterns.",
    false
);