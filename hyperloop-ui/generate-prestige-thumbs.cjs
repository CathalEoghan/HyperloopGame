// Makes the 400x250 thumbnails the Prestige page shows (the page picks each one up by the upgrade's name).
// Run from hyperloop-ui/:   node generate-prestige-thumbs.cjs
// By default it only makes thumbnails that are missing. To redo every one:   node generate-prestige-thumbs.cjs --all
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const inputDir = './src/assets/prestige-upgrades'
const outputDir = './src/assets/prestige-upgrades-thumb'
const redoAll = process.argv.includes('--all')

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

const kb = bytes => `${Math.round(bytes / 1024)} KB`

async function main() {
    const files = fs.readdirSync(inputDir).filter(f => /\.(jpe?g|png)$/i.test(f)).sort()
    let made = 0
    for (const file of files) {
        const name = file.replace(/\.(jpe?g|png)$/i, '')
        const out = path.join(outputDir, `${name}.jpg`)
        if (!redoAll && fs.existsSync(out)) continue
        await sharp(path.join(inputDir, file))
            .resize(400, 250, { fit: 'cover', position: 'centre' })
            .jpeg({ quality: 80 })
            .toFile(out)
        console.log(`Done: ${name}.jpg (${kb(fs.statSync(path.join(inputDir, file)).size)} -> ${kb(fs.statSync(out).size)})`)
        made++
    }
    console.log(made === 0 ? 'Nothing to do: every image already has a thumbnail.' : `Made ${made} thumbnail${made === 1 ? '' : 's'}.`)
}
main().catch(err => { console.error('Error:', err.message); process.exit(1) })
