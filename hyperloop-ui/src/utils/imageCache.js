// Starts downloading images so the browser has them cached before they're shown. Each Image
// object is only kept until its download finishes; after that the browser's own cache holds
// the file, so nothing stays in memory for the whole session (bug #89).
const requested = new Set()
const inFlight = new Set()
 
export function preloadImage(src) {
    if (!src || requested.has(src)) return
    requested.add(src)
    const img = new Image()
    inFlight.add(img)
    img.onload = img.onerror = () => inFlight.delete(img)
    img.src = src
}
 
export function preloadImages(srcs) {
    srcs.forEach(preloadImage)
}