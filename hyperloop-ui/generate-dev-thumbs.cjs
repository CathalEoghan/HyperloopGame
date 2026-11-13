// Makes the development card thumbnails the Development page shows (each one is picked up by the development's name,
// e.g. Bakery.jpg -> Bakery.jpg). The full-size originals stay in src/assets/developments.
// Run from hyperloop-ui/:   node generate-dev-thumbs.cjs
//
// The card shows a thumbnail 180 CSS pixels wide. On a sharper screen (a laptop at 125-200% scaling, a phone, a
// retina display) that is up to 360 real pixels, so the thumbnail is made at 360x360: exactly twice the size it is
// shown at, which is what keeps it crisp. A 180x180 file looked soft on those screens because the browser had to
// stretch it. mozjpeg at quality 75 keeps each file around 17 KB (about 6 MB for all of them).
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const inputDir = './src/assets/developments'
const outputDir = './src/assets/developments-thumb'
const SIZE = 360
const QUALITY = 75

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

const kb = bytes => `${Math.round(bytes / 1024)} KB`

// One at a time: the originals are large (4000x4000), and decoding hundreds of them at once can run out of memory
async function main() {
    const files = fs.readdirSync(inputDir).filter(f => /\.(jpe?g|png)$/i.test(f)).sort()
    let made = 0, total = 0
    for (const file of files) {
        const out = path.join(outputDir, file)
        await sharp(path.join(inputDir, file))
            .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
            .jpeg({ quality: QUALITY, mozjpeg: true })
            .toFile(out)
        total += fs.statSync(out).size
        console.log(`Done: ${file} (${kb(fs.statSync(out).size)})`)
        made++
    }
    console.log(`Made ${made} thumbnails, ${(total / 1048576).toFixed(1)} MB in all.`)
}
main().catch(err => { console.error('Error:', err.message); process.exit(1) })
