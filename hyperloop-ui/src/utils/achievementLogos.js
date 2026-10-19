// The logo for an achievement, or null when it has none yet (the page then falls back to the trophy / lock emoji).
// Each logo is a 128x128 thumbnail named after the achievement's id (made by generate-achievement-thumbs.cjs).
const LOGOS = import.meta.glob('../assets/achievement-logos-thumb/*.webp', { eager: true, import: 'default' })
const byName = {}
for (const [file, url] of Object.entries(LOGOS)) byName[file.split('/').pop().replace('.webp', '')] = url

// An achievement that was renamed but kept its old id (so it stays unlocked for players who have it) uses the new name's logo
const LOGO_NAME = { niceManager: 'goodbye' }

export function achievementLogo(id) {
    return byName[LOGO_NAME[id] || id] || null
}
