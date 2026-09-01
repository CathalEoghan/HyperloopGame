const sharp = require('sharp')
const path = require('path')

const inputDir = './src/assets/developments'
const outputDir = './src/assets/developments-thumb'

const devs = ['AntiLitteringCampaign', 'CrimePreventionCampaign', 'CarpetEmporium', 'ItalianDeli', 'CostumeStore', 'CaviarBar']

devs.forEach(dev => {
    sharp(path.join(inputDir, `${dev}.jpg`))
        .resize(366, 160, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(path.join(outputDir, `${dev}.jpg`))
        .then(() => console.log(`Done: ${dev}`))
        .catch(err => console.error(`Error: ${dev}`, err.message))
})