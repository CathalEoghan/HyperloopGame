// A country's flag image. The flags are part of the game's script (src/data/flagImages.js, made by generate-flags.cjs),
// so they show at once, with no downloads. `code` is the two-letter value in countryFlags.js; `width` is 40 (lists,
// globe) or 80 (the larger flags on the Progress page).
import { FLAG_IMAGES } from '../data/flagImages.js'

export const flagSrc = (code, width = 40) => FLAG_IMAGES[width]?.[code]
