
// High-End Boutique
import { Development } from "./Development.js";

// Revenue was 14800 (cost/revenue ratio 20.3) - roughly 1.5-2x every other development at this exact cost (e.g.
// Casino 300000/8800, ratio 34.1), making it the best ROI item in the whole list by a wide margin. Brought in
// line with that band instead of the stray value.
export const highEndBoutique = new Development(
    "High-End Boutique",
    300000,
    "Shopping",
    8800
);