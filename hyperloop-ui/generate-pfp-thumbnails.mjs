/**
 * Resize all profile pictures to 80x80 thumbnails in-place.
 * Run from hyperloop-ui/: node generate-pfp-thumbnails.mjs
 * Requires sharp: npm install sharp --save-dev
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PFP_DIRS = [
    path.join(__dirname, 'src/assets/male-profile-pics'),
    path.join(__dirname, 'src/assets/female-profile-pics'),
]

const SINGLE_FILES = [
    path.join(__dirname, 'src/assets/misc/defaultAccountIcon.png'),
    path.join(__dirname, 'src/assets/misc/officialAccountIcon.png'),
]

const SIZE = 80
const QUALITY = 85
const SKIP_UNDER_KB = 15

async function processDir(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`  Skipping ${dir} (not found)`)
        return { before: 0, after: 0, count: 0 }
    }
    const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort()
    let before = 0, after = 0, count = 0
    for (const fname of files) {
        const p = path.join(dir, fname)
        const size = fs.statSync(p).size
        before += size
        if (size < SKIP_UNDER_KB * 1024) {
            after += size
            count++
            continue
        }
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

async function processSingleFile(p, format = 'jpeg') {
    if (!fs.existsSync(p)) {
        console.log(`  Skipping ${path.basename(p)} (not found)`)
        return { before: 0, after: 0 }
    }
    const before = fs.statSync(p).size
    if (before < SKIP_UNDER_KB * 1024) {
        console.log(`  ${path.basename(p)}: already small (${(before/1024).toFixed(1)}KB) — skipped`)
        return { before, after: before }
    }
    const instance = sharp(p).resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
    if (format === 'png') {
        await instance.png({ quality: QUALITY }).toFile(p + '.tmp')
    } else {
        await instance.jpeg({ quality: QUALITY }).toFile(p + '.tmp')
    }
    fs.renameSync(p + '.tmp', p)
    const after = fs.statSync(p).size
    console.log(`  ${path.basename(p)}: ${(before/1024).toFixed(1)}KB -> ${(after/1024).toFixed(1)}KB`)
    return { before, after }
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

console.log(`\nProcessing misc icons...`)
for (const p of SINGLE_FILES) {
    const { before, after } = await processSingleFile(p, 'png')
    totalBefore += before
    totalAfter += after
    totalCount++
}

console.log(`\nTotal: ${totalCount} images`)
console.log(`Before: ${(totalBefore/1024).toFixed(0)}KB`)
console.log(`After:  ${(totalAfter/1024).toFixed(0)}KB`)
if (totalBefore > 0) {
    const pct = (100 * (1 - totalAfter / totalBefore)).toFixed(0)
    console.log(`Saved:  ${((totalBefore-totalAfter)/1024).toFixed(0)}KB (${pct}% reduction)`)
}