import defaultPfp from './misc/defaultAccountIcon.png'
import officialPfp from './misc/officialAccountIcon.png'

const malePfpModules = import.meta.glob('./male-profile-pics/*.jpg', { eager: true })
const femalePfpModules = import.meta.glob('./female-profile-pics/*.jpg', { eager: true })

export const MALE_PFPS = Object.entries(malePfpModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, m]) => m.default)

export const FEMALE_PFPS = Object.entries(femalePfpModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, m]) => m.default)

export { defaultPfp, officialPfp }