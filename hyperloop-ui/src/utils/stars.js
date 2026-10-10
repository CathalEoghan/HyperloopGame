// Positions for the background stars on the Home globe: `count` points scattered through a cube `size` wide
// and centred on the globe, but never within `clearRadius` of the centre. The camera orbits at most 5 units
// out, and a star near it is drawn as a big white square, so a clear zone keeps every star small and far away.
export function makeStarPositions(count = 2000, size = 100, clearRadius = 20, random = Math.random) {
    const positions = new Float32Array(count * 3)
    const clearSq = clearRadius * clearRadius
    for (let i = 0; i < count; i++) {
        let x, y, z
        do {
            x = (random() - 0.5) * size
            y = (random() - 0.5) * size
            z = (random() - 0.5) * size
        } while (x * x + y * y + z * z < clearSq)
        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = z
    }
    return positions
}
