const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const inputDir = './src/assets/developments'
const outputDir = './src/assets/developments-thumb'

fs.readdirSync(inputDir).forEach(file => {
    if (!file.match(/\.(jpg|jpeg|png)$/i)) return
    const outName = file.replace(/\.(png|jpeg)$/i, '.jpg')

    sharp(path.join(inputDir, file))
        .resize(366, 160, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(path.join(outputDir, outName))
        .then(() => console.log(`Done: ${outName}`))
        .catch(err => console.error(`Error: ${file}`, err.message))
})