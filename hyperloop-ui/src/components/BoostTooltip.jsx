import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// The income boost breakdown. Drawn on the page itself (not inside the popup) and placed from the badge's position, so
// a long list - 18 lines late in a run - always fits: above the badge if there is room, otherwise below, otherwise
// beside it, and scrollable only if it is taller than the whole window.
// text: plain sentences instead of a breakdown, so they wrap (at most 260px wide) and none is bold (an upgrade's effect).
const EDGE = 8

function BoostTooltip({ anchor, lines, text = false }) {
    const ref = useRef(null)
    const [pos, setPos] = useState(null)

    useLayoutEffect(() => {
        const el = ref.current
        if (!el || !anchor) return
        const a = anchor.getBoundingClientRect()
        const vw = window.innerWidth, vh = window.innerHeight
        const maxH = vh - EDGE * 2
        const h = Math.min(el.scrollHeight, maxH), w = el.offsetWidth
        const clampLeft = x => Math.min(Math.max(EDGE, x), Math.max(EDGE, vw - w - EDGE))
        const clampTop = y => Math.min(Math.max(EDGE, y), Math.max(EDGE, vh - h - EDGE))
        let top, left
        if (a.top - h - 6 >= EDGE) { top = a.top - h - 6; left = clampLeft(a.left + a.width / 2 - w / 2) }            // above
        else if (a.bottom + 6 + h <= vh - EDGE) { top = a.bottom + 6; left = clampLeft(a.left + a.width / 2 - w / 2) } // below
        else if (a.right + 8 + w <= vw - EDGE) { top = clampTop(a.top + a.height / 2 - h / 2); left = a.right + 8 }    // beside, right
        else if (a.left - 8 - w >= EDGE) { top = clampTop(a.top + a.height / 2 - h / 2); left = a.left - 8 - w }       // beside, left
        else { top = clampTop(a.bottom + 6); left = clampLeft(a.left + a.width / 2 - w / 2) }                          // tiny window: best effort
        setPos({ top, left, maxH })
    }, [anchor, lines])

    // A badge from a popup that has since closed is gone from the page: show nothing for it
    if (!anchor || !anchor.isConnected || !lines || lines.length === 0) return null
    return createPortal(
        <div
            ref={ref}
            role="tooltip"
            style={{
                position: 'fixed', top: pos ? pos.top : 0, left: pos ? pos.left : 0,
                visibility: pos ? 'visible' : 'hidden',
                maxHeight: pos ? pos.maxH : undefined, overflowY: 'auto',
                background: '#222', color: 'white', borderRadius: '6px', padding: '6px 10px',
                fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', whiteSpace: text ? 'normal' : 'nowrap', maxWidth: text ? '260px' : undefined, fontWeight: 'normal', textAlign: 'left',
                zIndex: 100000, pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
        >
            {lines.map((line, i) => (
                <div key={i} style={{
                    ...(i === 0 && !text ? { fontWeight: 'bold', marginBottom: '2px' } : {}),
                    ...(line.startsWith('Total:') ? { fontWeight: 'bold', borderTop: '1px solid #666', marginTop: '3px', paddingTop: '3px' } : {}),
                }}>{line}</div>
            ))}
        </div>,
        document.body
    )
}

export default BoostTooltip
