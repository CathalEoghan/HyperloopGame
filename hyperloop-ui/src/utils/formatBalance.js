// Shared by the top bar and the Prestige page, so big amounts read the same everywhere (bug #177)
const BALANCE_NAMES = ['billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion']

// Full digits below a billion; then "3.72 billion", "1.05 quadrillion" and so on
// (scientific notation past decillions)
export const formatBalance = (value) => {
    if (!Number.isFinite(value)) return '0'
    if (value < 1_000_000_000) return Math.floor(value).toLocaleString('en-GB', { maximumFractionDigits: 0 })
    let tier = Math.floor(Math.log10(value) / 3)
    if (tier > 2 + BALANCE_NAMES.length) return value.toExponential(2).replace('e+', 'e')
    let scaled = value / Math.pow(1000, tier)
    // 999.996 billion rounds to "1000.00 billion", so step up to the next name instead
    if (Number(scaled.toFixed(2)) >= 1000 && tier < 2 + BALANCE_NAMES.length) { tier += 1; scaled = value / Math.pow(1000, tier) }
    return `${scaled.toFixed(2)} ${BALANCE_NAMES[tier - 3]}`
}
