// Where a country's flag image lives. The flags are bundled with the game (public/flags, made by generate-flags.cjs),
// so they load from the same place as the game itself, not from another website. `code` is the two-letter value in
// countryFlags.js; `width` is 40 (lists, globe) or 80 (the larger flags on the Progress page).
export const flagSrc = (code, width = 40) => `${import.meta.env.BASE_URL}flags/w${width}/${code}.png`
