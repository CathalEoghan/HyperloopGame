const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// Mid-sized thumbnails specifically for the dev/upgrade reveal modals
// (~420px-wide display). Bigger and sharper than the 180x180 list
// thumbnails, but still a bundled local asset — no network round trip.
const inputDir = './src/assets/developments'
const outputDir = './src/assets/developments-reveal'

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

fs.readdirSync(inputDir).forEach(file => {
    if (!file.endsWith('.jpg') && !file.endsWith('.png')) return
    sharp(path.join(inputDir, file))
        .resize(600, 600, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 82 })
        .toFile(path.join(outputDir, file))
        .then(() => console.log(`Done: ${file}`))
        .catch(err => console.error(`Error: ${file}`, err.message))
})