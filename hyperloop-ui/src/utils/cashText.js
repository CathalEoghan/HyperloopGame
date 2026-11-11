import { createElement } from 'react'
import cashIcon from '../assets/misc/cash.png'

// Cash is shown with the cash icon everywhere, never a £ sign: the game's currency is universal (bug #211). Prose
// that lives in plain strings (the Guide, Prestige upgrade descriptions) still writes amounts as "£250" because it's
// one easy character to type; this swaps each £ for the icon when the text is drawn. Anything that isn't a string,
// or has no £ in it, comes back untouched.
export function withCashIcon(text, size = 13) {
    if (typeof text !== 'string' || !text.includes('£')) return text
    return text.split('£').flatMap((part, i) => i === 0 ? [part] : [
        createElement('img', {
            key: i, src: cashIcon, alt: 'cash', className: 'cash-icon',
            style: { width: `${size}px`, height: `${size}px`, verticalAlign: 'middle', border: 'none', borderRadius: '0', margin: '0 1px' },
        }),
        part,
    ])
}
