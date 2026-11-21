import { useState } from 'react'
import BoostTooltip from './BoostTooltip.jsx'

// The game's own dark tooltip for anything that used to rely on the browser's plain grey one (a title attribute).
// One per component, shared by everything in it, as only one thing is ever hovered at a time:
//   const tip = useHoverTip()
//   <span onMouseEnter={e => tip.enter(e, 'flag')} onMouseLeave={tip.leave}>...</span>
//   {tip.show('flag', 'France')}
// show() takes the words when it draws, not when the mouse arrives, so a tooltip that changes under the mouse (a mute
// button just clicked) shows the new words. enterIfCut() only shows it when the text is cut short with an ellipsis -
// for a long name or message, where the tooltip's only job is to show the rest of it.
export function useHoverTip() {
    const [at, setAt] = useState(null)   // { anchor, id }
    return {
        enter: (e, id = true) => setAt({ anchor: e.currentTarget, id }),
        enterIfCut: (e, id = true) => {
            const el = e.currentTarget
            if (el.scrollWidth > el.clientWidth) setAt({ anchor: el, id })
        },
        leave: () => setAt(null),
        show: (id, lines) => (at && at.id === id && lines
            ? <BoostTooltip anchor={at.anchor} lines={Array.isArray(lines) ? lines : [lines]} text />
            : null),
    }
}
