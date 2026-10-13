// Makes the country flag images the game shows (public/flags/w40 and public/flags/w80, one PNG per country code).
// They come from the open-source flag-icons set (MIT licence), drawn at the same two widths the game used to fetch
// from flagcdn.com. Only needed again if countryFlags.js gains a new country.
// Run from hyperloop-ui/:   npm install --no-save flag-icons   then   node generate-flags.cjs
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const codes = [...new Set([...fs.readFileSync('./src/data/countryFlags.js', 'utf8').matchAll(/:\s*["']([a-z0-9-]+)["']/g)].map(m => m[1]))].sort()
const flagDir = path.join('node_modules', 'flag-icons', 'flags', '4x3')
const WIDTHS = [40, 80]

async function main() {
    if (!fs.existsSync(flagDir)) { console.error('flag-icons is not installed. Run: npm install --no-save flag-icons'); process.exit(1) }
    for (const w of WIDTHS) fs.mkdirSync(path.join('public', 'flags', `w${w}`), { recursive: true })
    const missing = []
    for (const code of codes) {
        const svg = path.join(flagDir, `${code}.svg`)
        if (!fs.existsSync(svg)) { missing.push(code); continue }
        for (const w of WIDTHS) {
            await sharp(svg, { density: 300 }).resize(w).png({ palette: true, compressionLevel: 9 }).toFile(path.join('public', 'flags', `w${w}`, `${code}.png`))
        }
    }
    console.log(`Made ${(codes.length - missing.length) * WIDTHS.length} flag images for ${codes.length - missing.length} countries.`)
    if (missing.length) { console.error(`No flag found for: ${missing.join(', ')}`); process.exit(1) }
}
main().catch(err => { console.error('Error:', err.message); process.exit(1) })
