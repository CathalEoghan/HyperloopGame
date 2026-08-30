const fs = require('fs')
const path = require('path')

const devDir = String.raw`C:\Users\Cathal\Documents\HyperloopGame\DevelopmentManager`

let updated = 0
fs.readdirSync(devDir).filter(f => f.endsWith('.js')).forEach(filename => {
    const filepath = path.join(devDir, filename)
    let content = fs.readFileSync(filepath, 'utf8')
    const newContent = content.replace(
        /new Development\s*\(\s*"[^"]+"\s*,\s*(\d+)\s*,\s*"[^"]+"\s*,\s*(\d+)/g,
        (match, cost, revenue) => match
            .replace(cost, Math.round(parseInt(cost) / 10))
            .replace(revenue, Math.round(parseInt(revenue) / 8))
    )
    if (newContent !== content) {
        fs.writeFileSync(filepath, newContent)
        updated++
    }
})
console.log(`Updated ${updated} development files`)