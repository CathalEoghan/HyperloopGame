const sharp = require('sharp')

const cities = ['Beijing', 'Chengdu', 'Riga']

cities.forEach(city => {
    sharp(`./src/assets/cities/${city}.jpg`)
        .resize(1920, 1080, { fit: 'inside' })
        .jpeg({ quality: 70 })
        .toFile(`./src/assets/cities/${city}-small.jpg`)
        .then(() => console.log(`Done: ${city}`))
        .catch(err => console.error(`Error: ${city}`, err.message))
})