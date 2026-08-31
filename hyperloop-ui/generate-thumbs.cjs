const sharp = require('sharp')
const path = require('path')

const inputDir = './src/assets/cities'
const outputDir = './src/assets/cities-thumb'

const newCities = ['SantoDomingo', 'SanJosé', 'Hobart', 'Wrocław']

newCities.forEach(dev => {
    sharp(path.join(inputDir, `${dev}.jpg`))
        .resize(366, 160, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(path.join(outputDir, `${dev}.jpg`))
        .then(() => console.log(`Done: ${dev}`))
        .catch(err => console.error(`Error: ${dev}`, err.message))
})