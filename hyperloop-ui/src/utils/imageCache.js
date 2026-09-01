// Module-level map — persists for the entire app session, never garbage collected
const cache = new Map()

export function preloadImages(srcs) {
    srcs.forEach(src => {
        if (!cache.has(src)) {
            const img = new Image()
            img.src = src
            cache.set(src, img)
        }
    })
}

export function preloadImage(src) {
    if (!cache.has(src)) {
        const img = new Image()
        img.src = src
        cache.set(src, img)
    }
    return cache.get(src)
}