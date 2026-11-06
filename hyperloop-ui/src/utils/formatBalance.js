import { BIG_NUMBER_TIERS, scaleToTier } from './bigNumbers.js'

// Shared by the top bar and the Prestige page, so big amounts read the same everywhere (bug #177)
// Full digits below a billion; then "3.72 billion", "1.05 quadrillion" and so on, through the names in
// bigNumbers.js. Scientific notation takes over for a number whose tier has no name.
export const formatBalance = (value) => {
    if (!Number.isFinite(value)) return '0'
    if (value < 1_000_000_000) return Math.floor(value).toLocaleString('en-GB', { maximumFractionDigits: 0 })
    // A value that would round to "1000.00" of its tier steps up to the next one (see scaleToTier), which may have no
    // name, in which case it falls through to scientific notation rather than printing "1000.00 decillion"
    const { tier, scaled } = scaleToTier(value, 2)
    const name = BIG_NUMBER_TIERS[tier]?.[0]
    if (!name) return value.toExponential(2).replace('e+', 'e')
    return `${scaled.toFixed(2)} ${name}`
}
