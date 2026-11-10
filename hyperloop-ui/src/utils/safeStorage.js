// When the browser's storage is full (or a privacy setting blocks writing), every localStorage.setItem throws.
// The game writes small things all over the place while it draws (the tab lock, schedules, Hyper-Link state, intro
// flags...), and one of those throwing during start-up sent the whole game to its error screen - whose "Reset game"
// button would then have deleted the player's save. None of those writes is essential: the game keeps everything in
// memory and rebuilds them, so a refused one is skipped instead.
//
// The save itself is the exception. It still throws, so the game can tell the player their progress isn't being
// kept (App's writeSaveSafely shows the warning and Export still hands over the live game).
//
// Imported first in main.jsx, so it is in place before anything else touches storage.

const SAVE_KEY = 'hyperloop_save'

try {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function setItem(key, value) {
        try {
            return original.call(this, key, value)
        } catch (err) {
            if (key === SAVE_KEY) throw err
            console.warn(`Hyperloop Empire: the browser refused to store "${key}"`, err)
        }
    }
} catch { /* no Storage at all: nothing to guard */ }
