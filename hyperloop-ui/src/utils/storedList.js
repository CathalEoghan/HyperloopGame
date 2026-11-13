// A saved list that must be an array. Anything else (damaged text, a different kind of value, nothing saved) reads as
// an empty list, so a bad value in one of these small side keys can't stop the game from opening.
export function readStoredList(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key))
        return Array.isArray(value) ? value : []
    } catch {
        return []
    }
}
