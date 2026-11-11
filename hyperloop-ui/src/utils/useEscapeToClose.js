import { useEffect, useRef, useState } from 'react'

// Escape-to-close for dialogs. One window listener serves every dialog that uses this hook, and only the
// most recently opened one reacts, so Escape peels back one layer at a time (an enlarged Shop preview before
// the Shop, the Schedule before the Terminal Board it opened from) instead of closing everything at once.
//
// Only use it for dialogs that are safe to dismiss with no decision made (Shop, Guide, Credits, Achievements,
// the Schedule, page intros, Hyper-Link, event notices and the "you've unlocked..." reveals - where Escape does what
// their own Continue/Accept button does). Never to dismiss a popup the player has to answer: a farewell or greeting,
// a delay, or the city choice and city picker, where a stray Escape would pick a result for them. The farewell and
// delay popups register a handler that does nothing, so Escape stops at them rather than closing whatever is under them. (The one odd case is
// the "You've ranked up!" popup: it can't be dismissed, so there Escape means "continue" - the same as its button.)
//
// onEscape is what runs: pass the same function the dialog's own Close button runs. enabled=false opts out
// (e.g. a board shown without a way to leave it).

let nextOrder = 0
const open = new Map() // order -> () => void, one entry per mounted dialog using the hook

function onKeyDown(e) {
    if (e.key !== 'Escape' || e.defaultPrevented || e.repeat || open.size === 0) return
    const top = Math.max(...open.keys())
    e.preventDefault()
    open.get(top)?.()
}
// Added once; the flag keeps a hot-reloaded module in development from stacking a second listener.
if (typeof window !== 'undefined' && !window.__hyperloopEscapeListener) {
    window.__hyperloopEscapeListener = true
    window.addEventListener('keydown', onKeyDown)
}

export function useEscapeToClose(onEscape, enabled = true) {
    // Parents render before their children and a dialog opened later renders later, so this number puts the
    // newest, innermost dialog on top - effect order can't be used for that, since children run theirs first.
    const [order] = useState(() => ++nextOrder)
    const handler = useRef(onEscape)
    useEffect(() => { handler.current = onEscape })
    useEffect(() => {
        if (!enabled) return
        open.set(order, () => handler.current?.())
        return () => { open.delete(order) }
    }, [enabled, order])
}
