// Starts downloading images so the browser has them cached before they're shown. Each Image
// object is only kept until its download finishes; after that the browser's own cache holds
// the file, so nothing stays in memory for the whole session (bug #89). Preloading the same src
// twice returns the same promise instead of starting a second download.
const cache = new Map()

export function preloadImage(src) {
    if (!src) return Promise.resolve()
    const existing = cache.get(src)
    if (existing) return existing
    const promise = new Promise(resolve => {
        const img = new Image()
        // A failed image still counts as settled, rather than hanging the whole batch on it.
        img.onload = img.onerror = () => resolve()
        img.src = src
    })
    cache.set(src, promise)
    return promise
}

// Resolves once every image has settled (loaded or failed). onProgress(loaded, total) fires as
// each one settles - in whatever order they actually finish, not list order - so a loading
// screen can show real progress instead of guessing with a timer.
export function preloadImages(srcs, onProgress) {
    const total = srcs.length
    if (total === 0) return Promise.resolve()
    let loaded = 0
    return Promise.all(srcs.map(src => preloadImage(src).then(() => {
        loaded++
        onProgress?.(loaded, total)
    })))
}