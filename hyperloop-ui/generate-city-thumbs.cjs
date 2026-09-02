const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const inputDir = './src/assets/cities'
const outputDir = './src/assets/cities-thumb'

// Generates thumbnails for all cities missing from the thumb folder
const existing = new Set(fs.readdirSync(outputDir).map(f => f.toLowerCase()))

fs.readdirSync(inputDir).forEach(file => {
    if (!file.match(/\.(jpg|jpeg|png)$/i)) return
    const outName = file.replace(/\.(png|jpeg)$/i, '.jpg')
    if (existing.has(outName.toLowerCase())) return

    sharp(path.join(inputDir, file))
        .resize(400, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(path.join(outputDir, outName))
        .then(() => console.log(`Done: ${outName}`))
        .catch(err => console.error(`Error: ${file}`, err.message))
})