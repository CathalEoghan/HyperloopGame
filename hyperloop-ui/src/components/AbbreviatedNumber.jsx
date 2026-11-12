import { formatCompact } from '../utils/formatCompact.js'
import './AbbreviatedNumber.css'

// Shows the abbreviated figure by default; hovering the number itself swaps in the exact one, in place - not a
// tooltip appearing over it - with pure CSS (see AbbreviatedNumber.css) rather than a native title tooltip, so
// it reads as the number changing rather than a label popping up next to it. See utils/formatCompact.js for the
// abbreviation rule itself, shared across every "really long number" in the game.
function AbbreviatedNumber({ value, icon, iconAlt = '', iconSize = 13, iconStyle, prefix = '', suffix = '', threshold = 1_000_000, style, exact = true }) {
    return (
        <span className="abbrev-number" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', ...style }}>
            {icon && <img src={icon} alt={iconAlt} style={{ width: `${iconSize}px`, height: `${iconSize}px`, verticalAlign: 'middle', border: 'none', borderRadius: '0', ...iconStyle }} />}
            <span className="abbrev-number-compact">{prefix}{formatCompact(value, threshold)}{suffix}</span>
            {/* exact={false}: no hover swap to the full figure, for places (a button label) where the long number would not fit */}
            {exact && <span className="abbrev-number-full">{prefix}{Math.floor(value).toLocaleString('en-GB', { maximumFractionDigits: 0 })}{suffix}</span>}
        </span>
    )
}

export default AbbreviatedNumber
