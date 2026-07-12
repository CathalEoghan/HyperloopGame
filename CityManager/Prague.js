
// Prague
import { City } from "./City.js";
import { beerStore } from "../DevelopmentManager/BeerStore.js";

export const Prague = new City(
    "Prague",
    2300000,
    [beerStore],
    "Czechia",
    "Europe",
    2,
    "The Charles Bridge in Prague was built with a dash of magic and numerology. Emperor Charles IV had the first stone laid on July 9, 1357, at exactly 5:31 AM. This precise date and time - 135797531 - was a carefully chosen palindrome designed to protect the bridge for centuries against floods and wars.",
    false
);