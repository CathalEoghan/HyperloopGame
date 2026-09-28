const fs = require('fs')
const path = require('path')

// Regenerates src/data/developmentRevealThumbnails.js from whatever's sitting
// in src/assets/developments-reveal/ (run generate-dev-reveal-thumbs.cjs
// first). Matches entries against src/data/developmentImages.js by filename,
// so anything without a local reveal thumbnail is simply left out — the
// reveal modals already fall back to a Cloudinary-resized copy for those.
const revealDir = path.join(__dirname, 'src/assets/developments-reveal')
const imagesSrc = fs.readFileSync(path.join(__dirname, 'src/data/developmentImages.js'), 'utf8')

const re = /"([^"]+)":\s*"https:\/\/res\.cloudinary\.com\/[^"]+\/([^\/"]+\.(?:jpg|png))"/g
const pairs = []
let m
while ((m = re.exec(imagesSrc))) pairs.push([m[1], m[2]])

const available = new Set(fs.readdirSync(revealDir))
const covered = pairs.filter(([, file]) => available.has(file))
const missing = pairs.filter(([, file]) => !available.has(file))

const usedIds = new Set()
function makeId(file) {
    let base = file.replace(/\.(jpg|png)$/i, '').replace(/[^a-zA-Z0-9_$]/g, '_')
    if (/^[0-9]/.test(base)) base = '_' + base
    let id = base
    let n = 1
    while (usedIds.has(id)) id = `${base}_${n++}`
    usedIds.add(id)
    return id
}

const imports = []
const entries = []
covered.forEach(([name, file]) => {
    const id = makeId(file)
    imports.push(`import ${id} from '../assets/developments-reveal/${file}'`)
    entries.push(`    ${JSON.stringify(name)}: ${id},`)
})

const out = `${imports.join('\n')}\n\n\nconst developmentRevealImages = {\n${entries.join('\n')}\n}\n\nexport default developmentRevealImages\n`

fs.writeFileSync(path.join(__dirname, 'src/data/developmentRevealThumbnails.js'), out)
console.log(`Wrote src/data/developmentRevealThumbnails.js with ${covered.length} entries.`)
if (missing.length) {
    console.log(`${missing.length} entries have no local reveal thumbnail (will fall back to Cloudinary):`)
    missing.forEach(([name, file]) => console.log(`  - ${name} (${file})`))
}