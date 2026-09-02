const sharp = require('sharp')

sharp('./src/assets/developments/BeerStore.jpg')
    .resize(1920, 1080, { fit: 'inside' })
    .jpeg({ quality: 70 })
    .toFile('./src/assets/developments/BeerStore-small.jpg')
    .then(() => console.log('Done'))
    .catch(err => console.error(err.message))