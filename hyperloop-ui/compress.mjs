import sharp from 'sharp'
import { readdirSync, mkdirSync } from 'fs'
import { join } from 'path'

const folders = [
    { input: 'src/assets/cities', output: 'src/assets/cities-thumb' },
    { input: 'src/assets/developments', output: 'src/assets/developments-thumb' }
]

for (const { input, output } of folders) {
    const files = readdirSync(input).filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
    for (const file of files) {
        await sharp(join(input, file))
            .resize(400, 300, { fit: 'cover' })
            .jpeg({ quality: 70 })
            .toFile(join(output, file.replace(/\.png$/, '.jpg')))
        console.log('✓', file)
    }
}
console.log('Done!')