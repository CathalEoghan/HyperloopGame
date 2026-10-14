// Which globe textures to load. A choice the player made in Settings always wins; without one the game picks by
// itself. The 8K pair is 7.7 MB and has to be decoded into graphics memory, which took about 20 seconds on a slow
// school PC, so weak or slow devices get the 2K pair (0.7 MB) and capable ones keep 8K.
export const GLOBE_QUALITY_KEY = 'globeQuality'

let autoChoice = null

// 'Auto' picks 2K when any of these is true: the device is a phone or tablet, has under 4 GB of memory or under 4
// processor cores, is on a data-saver or slow connection (Chrome only), has no WebGL, a graphics card that can't hold an
// 8192-pixel texture, a software renderer, or old Intel integrated graphics (HD / UHD Graphics).
export function autoGlobeQuality() {
    if (autoChoice) return autoChoice
    let quality = '8k'
    try {
        const nav = navigator
        const conn = nav.connection
        if (conn && (conn.saveData || /^(slow-2g|2g|3g)$/.test(conn.effectiveType || '') || (conn.downlink > 0 && conn.downlink < 8))) quality = '2k'
        if (nav.deviceMemory && nav.deviceMemory < 4) quality = '2k'
        if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) quality = '2k'
        if (/Android|iPhone|iPad|iPod|Mobi/i.test(nav.userAgent || '')) quality = '2k'

        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        if (!gl) {
            quality = '2k'
        } else {
            if (gl.getParameter(gl.MAX_TEXTURE_SIZE) < 8192) quality = '2k'
            const info = gl.getExtension('WEBGL_debug_renderer_info')
            const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
            if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) quality = '2k'
            if (/intel/i.test(renderer) && /\b(u?hd) graphics/i.test(renderer)) quality = '2k'
            gl.getExtension('WEBGL_lose_context')?.loseContext()
        }
    } catch { quality = '2k' }   // can't tell: the light one is the safe choice
    autoChoice = quality
    return quality
}

// The player's saved choice ('2k' or '8k'), or null while they're on Auto
export function savedGlobeQuality() {
    try {
        const saved = localStorage.getItem(GLOBE_QUALITY_KEY)
        return saved === '2k' || saved === '8k' ? saved : null
    } catch { return null }
}

export function getGlobeQuality() {
    return savedGlobeQuality() || autoGlobeQuality()
}
