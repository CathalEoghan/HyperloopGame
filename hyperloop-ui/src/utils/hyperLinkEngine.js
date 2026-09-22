import { POSTS, FIRST_NAMES_MALE, FIRST_NAMES_FEMALE, SURNAMES } from '../data/hyperLinkData.js'
import { MALE_PFPS, FEMALE_PFPS, defaultPfp, officialPfp } from '../components/HyperLink.jsx'

const DEV_KEY_MAP = {
    'Irish Bar': 'irishBar',
    'Escape Room': 'escapeRoom',
    'Car Museum': 'carMuseum',
    'Hostel': 'hostel',
    'Terminal Radio': 'terminalRadio',
    'Convenience Store': 'convenienceStore',
    'Kennel': 'kennel',
    'Train Station': 'trainStation',
    'Gym': 'gym',
    'Skincare Store': 'skincareStore',
    'Cinema': 'cinema',
    'Swimwear Store': 'swimwearStore',
    'Smoothie Shop': 'smoothieShop',
    'Quiet Room': 'quietRoom',
    'Spa': 'spa',
    'Costume Store': 'costumeStore',
    'Post Office': 'postOffice',
    'Bank': 'bank',
    'Event Hall': 'eventHall',
}

const UPGRADE_KEY_MAP = {
    'Personal Styling Retinue': 'personalStylingRetinue',
    'Local Airport Links': 'localAirportLinks',
    'Billboard Design Overhauls': 'billboardDesignOverhauls',
}

function getTimeCategory() {
    const h = new Date().getHours()
    if (h >= 6 && h < 12) return 'morning'
    if (h >= 12 && h < 18) return 'afternoon'
    if (h >= 18 && h < 22) return 'evening'
    return 'night'
}

function getDayCategory() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[new Date().getDay()]
}

function buildEligibleCategories(gameState) {
    const {
        purchasedCities, purchasedDevelopments, purchasedUpgrades,
        activeEvent, schedule, trigger, rankSet
    } = gameState

    const cats = []
    const add = (category, weight, data = {}) => cats.push({ category, weight, data })

    // Always
    add('general', 2)
    add(getTimeCategory(), 3)
    add(getDayCategory(), 2)

    // Priority trigger (new city, new dev, delay, farewell, etc.)
    if (trigger) add(trigger.type, 25, trigger.data || {})

    // Conditional game state
    const now = new Date()
    const currentMins = now.getHours() * 60 + now.getMinutes()

    if (schedule?.length) {
        schedule.forEach(entry => {
            const diff = (entry.hour * 60 + entry.minute) - currentMins
            if (diff > 0 && diff <= 30) add('boarding', 4, { boardingCity: entry.name, gateNumber: entry.gate })
            if (diff > 0 && diff <= 10) add('finalCall', 6, { finalCallCity: entry.name, gateNumber: entry.gate })
            if (diff > 0 && diff <= 45 && diff > 30) add('goToGate', 3, { goToGateCity: entry.name, gateNumber: entry.gate })
            if (diff < 0 && diff > -60) add('departed', 3, { departedCity: entry.name })
        })
    }

    if (activeEvent?.type === 'positive') add('positiveEvent', 4)
    if (activeEvent?.type === 'negative') add('negativeEvent', 4)

    const foodCount = purchasedDevelopments.filter(d => d.category === 'Food').length
    if (foodCount === 0) add('noFood', 3)
    else if (foodCount > 10) add('manyFood', 2)

    if (purchasedDevelopments.filter(d => d.category === 'Shopping').length === 0) add('noShopping', 2)
    if (purchasedDevelopments.filter(d => d.category === 'Recreation').length === 0) add('noRecreation', 2)
    if (purchasedDevelopments.filter(d => d.category === 'Service').length === 0) add('noService', 2)
    if (purchasedDevelopments.filter(d => d.category === 'Enterprise').length === 0) add('noEnterprise', 2)

    if (purchasedCities.length < 10) add('fewCities', 2)

    const adCampaigns = purchasedUpgrades.filter(u => u.effectType === 'countryAdvertisingBoost')
    if (adCampaigns.length > 0) {
        const campaign = adCampaigns[Math.floor(Math.random() * adCampaigns.length)]
        add('advertisingCampaign', 2, { campaignCountry: campaign.effectTarget })
    }

    if (rankSet >= 10) add('milestone10', 1)
    if (rankSet >= 50) add('milestone50', 1)

    purchasedDevelopments.forEach(dev => {
        const key = DEV_KEY_MAP[dev.name]
        if (key && POSTS[key]) add(key, 2)
    })

    purchasedUpgrades.forEach(upg => {
        const key = UPGRADE_KEY_MAP[upg.name]
        if (key && POSTS[key]) add(key, 2)
    })

    return cats
}

function pickCategory(cats) {
    const total = cats.reduce((s, c) => s + c.weight, 0)
    let rand = Math.random() * total
    for (const cat of cats) {
        rand -= cat.weight
        if (rand <= 0) return cat
    }
    return cats[0]
}

function substituteText(text, data, gameState) {
    const { terminalName, homeCity, purchasedCities } = gameState
    const now = new Date()
    return text
        .replace(/\{terminalName\}/g, terminalName)
        .replace(/\{homeCity\}/g, homeCity?.name || terminalName)
        .replace(/\{city\}/g, data.city || purchasedCities[purchasedCities.length - 1]?.name || 'the new city')
        .replace(/\{CITY\}/g, (data.city || '').toUpperCase())
        .replace(/\{boardingCity\}/g, data.boardingCity || '')
        .replace(/\{finalCallCity\}/g, data.finalCallCity || '')
        .replace(/\{goToGateCity\}/g, data.goToGateCity || '')
        .replace(/\{departedCity\}/g, data.departedCity || '')
        .replace(/\{delayedCity\}/g, data.delayedCity || '')
        .replace(/\{gateNumber\}/g, data.gateNumber || '')
        .replace(/\{campaignCountry\}/g, data.campaignCountry || '')
        .replace(/\{store\}/g, data.store || 'new store')
        .replace(/\{recreation\}/g, data.recreation || 'new attraction')
        .replace(/\{service\}/g, data.service || 'new service')
        .replace(/\{currentTime\}/g, now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        .replace(/\{cityCount\}/g, purchasedCities.length)
}

function generateUser(gender, usedPfps, userPfpMap, handle) {
    // Check if this handle already has a pfp assigned
    if (userPfpMap[handle]) return userPfpMap[handle]

    const useReal = Math.random() < 0.6
    if (!useReal) return { pfp: null, pfpId: 'default' }

    const pool = gender === 'male' ? MALE_PFPS : FEMALE_PFPS
    const available = pool.filter((_, i) => {
        const id = `${gender}_${i}`
        return !usedPfps.includes(id)
    })

    if (available.length === 0) return { pfp: null, pfpId: 'default' }

    const idx = Math.floor(Math.random() * available.length)
    const poolIdx = pool.indexOf(available[idx])
    const pfpId = `${gender}_${poolIdx}`
    return { pfp: available[idx], pfpId }
}

export function generateHyperLinkPost(gameState) {
    const {
        terminalName, usedPostIds, usedPfps, userPfpMap, trigger
    } = gameState

    // Occasionally generate official post
    const isOfficial = Math.random() < 0.20

    if (isOfficial) {
        const officialPosts = POSTS.official || []
        const available = officialPosts
            .map((text, i) => ({ id: `official_${i}`, text }))
            .filter(p => !usedPostIds.includes(p.id))
        if (available.length === 0) return null

        const post = available[Math.floor(Math.random() * available.length)]
        return {
            id: `post_${Date.now()}_${Math.random()}`,
            text: substituteText(post.text, {}, gameState),
            displayName: `${terminalName}`,
            handle: `@${terminalName.toLowerCase().replace(/\s+/g, '')}official`,
            pfp: officialPfp,
            isOfficial: true,
            isItalic: false,
            timestamp: Date.now(),
            usedPostId: post.id,
            usedPfpId: 'official',
        }
    }

    const cats = buildEligibleCategories(gameState)
    if (cats.length === 0) return null

    const selected = pickCategory(cats)
    const categoryPosts = POSTS[selected.category]
    if (!categoryPosts?.length) return null

    const available = categoryPosts
        .map((text, i) => ({ id: `${selected.category}_${i}`, text }))
        .filter(p => !usedPostIds.includes(p.id))

    if (available.length === 0) return null

    const chosenPost = available[Math.floor(Math.random() * available.length)]
    const gender = Math.random() < 0.5 ? 'male' : 'female'
    const firstName = gender === 'male'
        ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
        : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)]
    const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)]
    const displayName = `${firstName} ${surname}`
    const handle = `@hyper-linkuser${Math.floor(10000000 + Math.random() * 90000000)}`

    const { pfp, pfpId } = generateUser(gender, usedPfps, userPfpMap, handle)

    const isItalic = chosenPost.text.startsWith('*(') && chosenPost.text.endsWith(')*')
    const cleanText = isItalic
        ? chosenPost.text.slice(2, -2)
        : chosenPost.text

    return {
        id: `post_${Date.now()}_${Math.random()}`,
        text: substituteText(cleanText, selected.data, gameState),
        displayName,
        handle,
        pfp,
        isOfficial: false,
        isItalic,
        timestamp: Date.now(),
        usedPostId: chosenPost.id,
        usedPfpId: pfpId,
        gender,
    }
}