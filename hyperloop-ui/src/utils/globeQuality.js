// Which globe textures to load. A choice the player made in Settings always wins; without one the game picks by
// itself. The 16K pair is about 15.8 MB, the 8K pair 7.7 MB, and the 2K pair 0.7 MB, each one decoded into graphics
// memory - the 8K pair alone took about 20 seconds on a slow school PC - so weak or slow devices get the 2K pair,
// capable ones get 8K, and only devices whose GPU can actually hold a 16384-pixel texture get offered 16K.
export const GLOBE_QUALITY_KEY = 'globeQuality'

let autoChoice = null

// 'Auto' picks 2K when any of these is true: the device is a phone or tablet, has under 4 GB of memory or under 4
// processor cores, is on a data-saver or slow connection (Chrome only), has no WebGL, a graphics card that can't hold
// an 8192-pixel texture, a software renderer, or old Intel integrated graphics (HD / UHD Graphics). Otherwise it's
// 16K if the GPU can hold a 16384-pixel texture, 8K if it can only hold 8192.
export function autoGlobeQuality() {
    if (autoChoice) return autoChoice
    let weak = false
    let maxTextureSize = 0
    try {
        const nav = navigator
        const conn = nav.connection
        if (conn && (conn.saveData || /^(slow-2g|2g|3g)$/.test(conn.effectiveType || '') || (conn.downlink > 0 && conn.downlink < 8))) weak = true
        if (nav.deviceMemory && nav.deviceMemory < 4) weak = true
        if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) weak = true
        if (/Android|iPhone|iPad|iPod|Mobi/i.test(nav.userAgent || '')) weak = true

        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        if (!gl) {
            weak = true
        } else {
            maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
            if (maxTextureSize < 8192) weak = true
            const info = gl.getExtension('WEBGL_debug_renderer_info')
            const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
            if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) weak = true
            if (/intel/i.test(renderer) && /\b(u?hd) graphics/i.test(renderer)) weak = true
            gl.getExtension('WEBGL_lose_context')?.loseContext()
        }
    } catch { weak = true }   // can't tell: the light one is the safe choice
    autoChoice = weak ? '2k' : (maxTextureSize >= 16384 ? '16k' : '8k')
    return autoChoice
}

// The player's saved choice ('2k', '8k' or '16k'), or null while they're on Auto
export function savedGlobeQuality() {
    try {
        const saved = localStorage.getItem(GLOBE_QUALITY_KEY)
        return saved === '2k' || saved === '8k' || saved === '16k' ? saved : null
    } catch { return null }
}

export function getGlobeQuality() {
    return savedGlobeQuality() || autoGlobeQuality()
}
