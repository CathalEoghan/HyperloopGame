
// Vienna
import { City } from "./City.js";
import { watchStore } from "../DevelopmentManager/WatchStore.js";

export const Vienna = new City(
    "Vienna",
    2900000,
    [watchStore],
    "Austria",
    "Europe",
    2,
    "The Karl-Marx-Hof is over one kilometer long, making it the longest single contiguous residential building in the world.",
    false
);