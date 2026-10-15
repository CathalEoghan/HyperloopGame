// Fullscreen for the browser build. A desktop wrapper (Steam) would replace these functions with its own window
// controls; the Settings page only talks to this file.

export const fullscreenSupported = () =>
    typeof document !== 'undefined' && !!document.fullscreenEnabled && !!document.documentElement.requestFullscreen

export const isFullscreen = () => typeof document !== 'undefined' && !!document.fullscreenElement

// Needs a click or key press to start (a browser rule), so it is never switched on automatically.
export async function setFullscreen(on) {
    try {
        if (on && !document.fullscreenElement) await document.documentElement.requestFullscreen()
        else if (!on && document.fullscreenElement) await document.exitFullscreen()
    } catch { /* refused (no user gesture, or blocked by the browser): the state simply stays as it was */ }
}

// Calls `listener` with the new state whenever it changes, including when the player leaves with Esc or F11.
// Returns a function that stops listening.
export function onFullscreenChange(listener) {
    const handler = () => listener(isFullscreen())
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
}
