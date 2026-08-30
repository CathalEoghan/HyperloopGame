const fs = require('fs')
const path = require('path')

const dir = String.raw`C:\Users\Cathal\Documents\HyperloopGame\UpgradeManager`

let updated = 0
fs.readdirSync(dir).filter(f => f.endsWith('.js')).forEach(filename => {
    const filepath = path.join(dir, filename)
    let content = fs.readFileSync(filepath, 'utf8')
    const newContent = content.replace(
        /(new Upgrade\s*\(\s*['"][^'"]+['"]\s*,\s*)(\d+)(\s*,)/g,
        (match, pre, cost, post) => `${pre}${Math.round(parseInt(cost) * 5)}${post}`
    )
    if (newContent !== content) {
        fs.writeFileSync(filepath, newContent)
        updated++
    }
})
console.log(`Updated ${updated} upgrade files`)