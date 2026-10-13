// Makes src/data/flagImages.js: every country flag as a small PNG written into the file as text (a "data URI"), at the
// two widths the game uses (40 for lists and the globe, 80 for the larger flags on the Progress page). The flags are
// therefore part of the game's script and show with no extra downloads. They are drawn from the open-source flag-icons
// set (MIT licence). Only needed again if countryFlags.js gains a new country.
// Run from hyperloop-ui/:   npm install --no-save flag-icons   then   node generate-flags.cjs
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const codes = [...new Set([...fs.readFileSync('./src/data/countryFlags.js', 'utf8').matchAll(/:\s*["']([a-z0-9-]+)["']/g)].map(m => m[1]))].sort()
const flagDir = path.join('node_modules', 'flag-icons', 'flags', '4x3')
const WIDTHS = [40, 80]

async function main() {
    if (!fs.existsSync(flagDir)) { console.error('flag-icons is not installed. Run: npm install --no-save flag-icons'); process.exit(1) }
    const missing = []
    const out = { 40: {}, 80: {} }
    for (const code of codes) {
        const svg = path.join(flagDir, `${code}.svg`)
        if (!fs.existsSync(svg)) { missing.push(code); continue }
        for (const w of WIDTHS) {
            const png = await sharp(svg, { density: 300 }).resize(w).png({ palette: true, compressionLevel: 9 }).toBuffer()
            out[w][code] = `data:image/png;base64,${png.toString('base64')}`
        }
    }
    const lines = ['// Made by generate-flags.cjs. Do not edit by hand.', 'export const FLAG_IMAGES = {']
    for (const w of WIDTHS) {
        lines.push(`    ${w}: {`)
        for (const code of Object.keys(out[w])) lines.push(`        '${code}': '${out[w][code]}',`)
        lines.push('    },')
    }
    lines.push('}', '')
    fs.writeFileSync('./src/data/flagImages.js', lines.join('\n'))
    const kb = Math.round(fs.statSync('./src/data/flagImages.js').size / 1024)
    console.log(`Wrote src/data/flagImages.js: ${Object.keys(out[40]).length} countries at 2 sizes, ${kb} KB.`)
    if (missing.length) { console.error(`No flag found for: ${missing.join(', ')}`); process.exit(1) }
}
main().catch(err => { console.error('Error:', err.message); process.exit(1) })
