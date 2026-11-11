import { scaleToTier, BIG_NUMBER_TIERS } from './bigNumbers.js'

// Shared by every "really long number" display in the game (the rank bar's XP, the City/Development pages'
// income totals, and cash payout popups - daily bonus, offline earnings, delay compensation, event payouts,
// claimed rewards - see components/AbbreviatedNumber.jsx) so they all abbreviate the same way: "43.81 million"
// once `value` reaches `threshold`, using the same tier names as the top bar's own formatBalance (bug #177).
// Below `threshold`, the full number is shown as-is - there's nothing to abbreviate yet.
export const formatCompact = (value, threshold = 1_000_000) => {
    if (!Number.isFinite(value)) return '0'
    const abs = Math.abs(value)
    if (abs < threshold) return Math.floor(value).toLocaleString('en-GB', { maximumFractionDigits: 0 })
    const sign = value < 0 ? '-' : ''
    const { tier, scaled } = scaleToTier(abs, 2)
    const name = BIG_NUMBER_TIERS[tier]?.[0]
    if (!name) return `${sign}${abs.toExponential(2).replace('e+', 'e')}`
    return `${sign}${scaled.toFixed(2)} ${name}`
}
