
import { Development } from "./Development.js";

// Revenue was 3640 (cost/revenue ratio 74.2) - roughly half of every other development in the 260k-325k cost
// band (e.g. Jewellery Shop 295000/9600, ratio 30.7), which this cost otherwise fits into cleanly. Brought in
// line with that band instead of the stray value.
export const soapStore = new Development(
    "Soap Store",
    270000,
    "Shopping",
    8800
);