
import { useState, useCallback } from 'react'

// Like useState for a UI choice (a sort order, a filter tab), but remembered between visits.
// Falls back to the default if nothing is stored, the stored value is no longer one of the allowed
// options, or storage is unavailable.
export function usePersistedChoice(key, allowed, fallback) {
    const [value, setValue] = useState(() => {
        try {
            const stored = localStorage.getItem(key)
            return allowed.includes(stored) ? stored : fallback
        } catch {
            return fallback
        }
    })
    const set = useCallback(next => {
        setValue(next)
        try { localStorage.setItem(key, next) } catch { /* storage blocked, ignore */ }
    }, [key])
    return [value, set]
}