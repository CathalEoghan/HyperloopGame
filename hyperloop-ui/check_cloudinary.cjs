const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
    cloud_name: 's25xbw85',
    api_key: '211434693264273',
    api_secret: 'oUYA038gpEcW6d-YERDa5hJlbuc'
});

const cityImagesContent = fs.readFileSync('./src/data/cityImages.js', 'utf8');
const cityNames = [...cityImagesContent.matchAll(/"(.+?)":\s*"https/g)].map(m => m[1]);

async function getAllResources() {
    let resources = [];
    let nextCursor = null;
    do {
        const result = await cloudinary.api.resources({
            type: 'upload',
            max_results: 500,
            next_cursor: nextCursor
        });
        resources = resources.concat(result.resources);
        nextCursor = result.next_cursor;
    } while (nextCursor);
    return resources.map(r => r.public_id);
}

getAllResources().then(uploaded => {
    console.log(`Total on Cloudinary: ${uploaded.length}`);
    console.log(`Total in cityImages.js: ${cityNames.length}`);
    const normalize = str => str.replace(/['\s,\.]/g, '').toLowerCase();
    const uploadedNorm = uploaded.map(normalize);
    const missing = cityNames.filter(name => !uploadedNorm.includes(normalize(name)));
    console.log(`\nMissing from Cloudinary (${missing.length}):`);
    missing.forEach(m => console.log(`  ❌ ${m}`));
}).catch(err => console.error('Error:', err.message));