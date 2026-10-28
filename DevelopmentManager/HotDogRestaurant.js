
import { Development } from "./Development.js";

// Revenue was 4800 (cost/revenue ratio 67.7) - roughly half of every other development at this exact cost (e.g.
// Grand Hotel 325000/10000, ratio 32.5). Brought in line with that band instead of the stray value.
export const hotDogRestaurant = new Development(
    "Hot Dog Restaurant",
    325000,
    "Food",
    9600
);