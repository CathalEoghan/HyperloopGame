const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const inputDir = './src/assets/developments'
const outputDir = './src/assets/developments-thumb'

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

fs.readdirSync(inputDir).forEach(file => {
    if (!file.endsWith('.jpg') && !file.endsWith('.png')) return
    sharp(path.join(inputDir, file))
        .resize(180, 180, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 80 })
        .toFile(path.join(outputDir, file))
        .then(() => console.log(`Done: ${file}`))
        .catch(err => console.error(`Error: ${file}`, err.message))
})