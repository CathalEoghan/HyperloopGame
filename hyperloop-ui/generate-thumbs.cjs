const sharp = require('sharp')

sharp('./src/assets/developments/CustomerServiceTraining.jpg')
    .resize(366, 160, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile('./src/assets/developments-thumb/CustomerServiceTraining.jpg')
    .then(() => console.log('Done: CustomerServiceTraining'))
    .catch(err => console.error('Error:', err.message))