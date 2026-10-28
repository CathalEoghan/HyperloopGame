
import { Development } from "./Development.js";

// Revenue was 4000 (cost/revenue ratio 75.0) - roughly half of every other development at this exact cost (e.g.
// Casino 300000/8800, ratio 34.1). Brought in line with that band instead of the stray value.
export const cupcakeStore = new Development(
    "Cupcake Store",
    300000,
    "Food",
    8800
);