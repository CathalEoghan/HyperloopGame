// The names of large numbers on the short scale (each is 1000 times the one before), as the game shows them.
// The key is the tier: how many times the number has been divided by 1000, so a million is tier 2 and a decillion
// is tier 11. The first item is the full name (the balance), the second the short form (the Work button).
// A number in a tier with no entry here is written in scientific notation instead.
export const BIG_NUMBER_TIERS = {
    2: ['million', 'm'],
    3: ['billion', 'b'],
    4: ['trillion', 't'],
    5: ['quadrillion', 'qa'],
    6: ['quintillion', 'qi'],
    7: ['sextillion', 'sx'],
    8: ['septillion', 'sp'],
    9: ['octillion', 'oc'],
    10: ['nonillion', 'no'],
    11: ['decillion', 'dc'],
    12: ['undecillion', 'ud'],
    13: ['duodecillion', 'dd'],
    14: ['tredecillion', 'td'],
    15: ['quattuordecillion', 'qad'],
    16: ['quindecillion', 'qid'],
    17: ['sexdecillion', 'sxd'],
    18: ['septendecillion', 'spd'],
    19: ['octodecillion', 'ocd'],
    20: ['novemdecillion', 'nod'],
    21: ['vigintillion', 'vg'],     // 10^63
    31: ['trigintillion', 'tg'],    // 10^93
    41: ['quadragintillion', 'qag'], // 10^123
    101: ['centillion', 'ce'],      // 10^303
}

// Which tier a value falls in and the value divided down to it, for a number shown with `decimals` places.
// A value that would round up to 1000 of its tier (999.96 with one place) moves up to the next tier instead, so
// "1000.0" is never printed.
export function scaleToTier(value, decimals) {
    let tier = Math.max(0, Math.floor(Math.log10(value) / 3))
    // Guard against Math.log10 landing a hair either side of a power of 1000
    while (tier > 0 && value / Math.pow(1000, tier) < 1) tier -= 1
    while (value / Math.pow(1000, tier + 1) >= 1) tier += 1
    let scaled = value / Math.pow(1000, tier)
    if (Number(scaled.toFixed(decimals)) >= 1000) {
        tier += 1
        scaled = value / Math.pow(1000, tier)
    }
    return { tier, scaled }
}
