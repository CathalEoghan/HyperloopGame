// Makes the small 128x128 achievement logos the Achievements page and the unlock toast show (each one is picked up by the
// achievement's id, e.g. firstSteps.png -> firstSteps.webp). The 512x512 originals stay in src/assets/achievement-logos.
// Run from hyperloop-ui/:   node generate-achievement-thumbs.cjs
// By default it only makes thumbnails that are missing. To redo every one:   node generate-achievement-thumbs.cjs --all
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const inputDir = './src/assets/achievement-logos'
const outputDir = './src/assets/achievement-logos-thumb'
const redoAll = process.argv.includes('--all')

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

const kb = bytes => `${Math.round(bytes / 1024)} KB`

async function main() {
    const files = fs.readdirSync(inputDir).filter(f => /\.(jpe?g|png)$/i.test(f)).sort()
    let made = 0
    for (const file of files) {
        const name = file.replace(/\.(jpe?g|png)$/i, '')
        const out = path.join(outputDir, `${name}.webp`)
        if (!redoAll && fs.existsSync(out)) continue
        await sharp(path.join(inputDir, file))
            .resize(128, 128, { fit: 'cover', position: 'centre' })
            .webp({ quality: 85 })
            .toFile(out)
        console.log(`Done: ${name}.webp (${kb(fs.statSync(path.join(inputDir, file)).size)} -> ${kb(fs.statSync(out).size)})`)
        made++
    }
    console.log(made === 0 ? 'Nothing to do: every logo already has a thumbnail.' : `Made ${made} thumbnail${made === 1 ? '' : 's'}.`)
}
main().catch(err => { console.error('Error:', err.message); process.exit(1) })
