// A soft, seamless cloud layer drawn once in code, so there is nothing to download. Alpha carries the cloud cover
// (white where cloudy, clear elsewhere); the globe shades it for day and night. It wraps around left to right so
// the seam at the date line can't show. Kept deliberately small - 1024 x 512 is about a fifth of a second of work.
function hash(x, y, seed) {
    let h = (x * 374761393 + y * 668265263 + seed * 144665) | 0
    h = (h ^ (h >>> 13)) * 1274126177
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

// Smooth value noise on a grid that repeats every `cols` cells sideways
function valueNoise(u, v, cols, seed) {
    const x0 = Math.floor(u), y0 = Math.floor(v)
    const fx = u - x0, fy = v - y0
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
    const xa = ((x0 % cols) + cols) % cols, xb = (xa + 1) % cols
    const a = hash(xa, y0, seed), b = hash(xb, y0, seed)
    const c = hash(xa, y0 + 1, seed), d = hash(xb, y0 + 1, seed)
    return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy
}

export function makeCloudCanvas(width = 1024, height = 512, seed = 7) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas
    const image = ctx.createImageData(width, height)
    const octaves = 5
    for (let y = 0; y < height; y++) {
        // Fewer clouds towards the poles, where the map is squeezed the most
        const lat = Math.abs(y / height - 0.5) * 2
        const polar = 1 - lat * lat * 0.55
        for (let x = 0; x < width; x++) {
            let amp = 0.5, freq = 1, sum = 0, norm = 0
            for (let o = 0; o < octaves; o++) {
                const cols = 8 * freq
                sum += amp * valueNoise((x / width) * cols, (y / height) * 4 * freq, cols, seed + o)
                norm += amp
                amp *= 0.55
                freq *= 2
            }
            const n = (sum / norm) * polar
            const t = Math.min(1, Math.max(0, (n - 0.43) / 0.2))
            const alpha = t * t * (3 - 2 * t)
            const i = (y * width + x) * 4
            image.data[i] = image.data[i + 1] = image.data[i + 2] = 255
            image.data[i + 3] = Math.round(alpha * 255)
        }
    }
    ctx.putImageData(image, 0, 0)
    return canvas
}
