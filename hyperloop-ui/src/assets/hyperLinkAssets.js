import defaultPfp from './misc/defaultAccountIcon.png'
import officialPfp from './misc/globeIcon.png'

const malePfpModules = import.meta.glob('./male-profile-pics/*.jpg', { eager: true })
const femalePfpModules = import.meta.glob('./female-profile-pics/*.jpg', { eager: true })

const malePfpEntries = Object.entries(malePfpModules).sort(([a], [b]) => a.localeCompare(b))
export const MALE_PFPS = malePfpEntries.map(([, m]) => m.default)

// The developer's own photo (m_pfp_086.jpg). A post from an account that uses it is the Cameo achievement's post:
// pfp ids are the gender and the picture's place in the sorted list (see generateUser in hyperLinkEngine).
export const CAMEO_PFP_ID = `male_${malePfpEntries.findIndex(([path]) => path.endsWith('/m_pfp_086.jpg'))}`

export const FEMALE_PFPS = Object.entries(femalePfpModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, m]) => m.default)

export { defaultPfp, officialPfp }