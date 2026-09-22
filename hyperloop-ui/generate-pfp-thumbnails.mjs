/**
 * Resize all profile pictures to 80x80 thumbnails in-place.
 * Run from the repo root: node scripts/generate-pfp-thumbnails.mjs
 * Requires sharp: npm install sharp --save-dev (in hyperloop-ui/)
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const PFP_DIRS = [
    path.join(ROOT, 'hyperloop-ui/src/assets/male-profile-pics'),
    path.join(ROOT, 'hyperloop-ui/src/assets/female-profile-pics'),
]

const SIZE = 80
const QUALITY = 85

async function processDir(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`  Skipping ${dir} (not found)`)
        return { before: 0, after: 0, count: 0 }
    }
    const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort()
    let before = 0, after = 0, count = 0
    for (const fname of files) {
        const p = path.join(dir, fname)
        before += fs.statSync(p).size
        await sharp(p)
            .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
            .jpeg({ quality: QUALITY })
            .toFile(p + '.tmp')
        fs.renameSync(p + '.tmp', p)
        after += fs.statSync(p).size
        count++
    }
    return { before, after, count }
}

let totalBefore = 0, totalAfter = 0, totalCount = 0
for (const dir of PFP_DIRS) {
    console.log(`Processing ${dir}...`)
    const { before, after, count } = await processDir(dir)
    totalBefore += before
    totalAfter += after
    totalCount += count
    console.log(`  ${count} images: ${(before/1024).toFixed(0)}KB -> ${(after/1024).toFixed(0)}KB`)
}
console.log(`\nTotal: ${totalCount} images`)
console.log(`Before: ${(totalBefore/1024).toFixed(0)}KB`)
console.log(`After:  ${(totalAfter/1024).toFixed(0)}KB`)
if (totalBefore > 0) {
    const pct = (100 * (1 - totalAfter / totalBefore)).toFixed(0)
    console.log(`Saved:  ${((totalBefore-totalAfter)/1024).toFixed(0)}KB (${pct}% reduction)`)
}