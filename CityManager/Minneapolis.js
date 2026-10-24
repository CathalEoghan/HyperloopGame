
// Minneapolis
import { City } from "./City.js";
import { bikeRental } from "../DevelopmentManager/BikeRental.js";

export const Minneapolis = new City(
    "Minneapolis",
    3790000,
    [bikeRental],
    "United States of America",
    "North America",
    2,
    "The Minneapolis Skyway System stretches for 9.5 continuous miles across 80 downtown blocks. It allows locals to navigate the city entirely indoors during brutal winters.",
    false
);