import { POSTS, FIRST_NAMES_MALE, FIRST_NAMES_FEMALE, SURNAMES } from '../data/hyperLinkData.js'
import { MALE_PFPS, FEMALE_PFPS } from '../assets/hyperLinkAssets.js'
import { minutesUntilDeparture } from './time.js'
import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'

// Development names are written in title case ("Pharmacy"), but in a post people write them as ordinary words
// ("the pharmacy"). Only names that are proper nouns or acronyms keep their capitals.
const POST_KEEP_CAPS = { indian: 'Indian', vietnamese: 'Vietnamese', moroccan: 'Moroccan', italian: 'Italian', irish: 'Irish', hyperloop: 'Hyperloop', sim: 'SIM' }
export function inPost(name) {
    return String(name).replace(/[A-Za-zÀ-ÿ]+/g, w => POST_KEEP_CAPS[w.toLowerCase()] || w.toLowerCase())
}


const DEV_KEY_MAP = {
    'Irish Bar': 'irishBar',
    'Escape Room': 'escapeRoom',
    'Car Museum': 'carMuseum',
    'Hostel': 'hostel',
    'Convenience Store': 'convenienceStore',
    'Kennel': 'kennel',
    'Gym': 'gym',
    'Skincare Store': 'skincareStore',
    'Cinema': 'cinema',
    'Swimwear Store': 'swimwearStore',
    'Smoothie Shop': 'smoothieShop',
    'Spa': 'spa',
    'Costume Store': 'costumeStore',
    'Bakery': 'bakery',
    'Beer Tent': 'beerTent',
    'Pharmacy': 'pharmacy',
    'Yoga Studio': 'yogaStudio',
    'Petting Zoo': 'pettingZoo',
    'Street Food Fair': 'streetFoodFair',
    'Hyperloop Museum': 'hyperloopMuseum',
    'Sim Card Services': 'simCardServices',
    'Watch Store': 'watchStore',
    'Candy Store': 'candyStore',
    'Bookstore': 'bookstore',
    'Bowling Alley': 'bowlingAlley',
    'Luxury Hotel': 'luxuryHotel',
    'Gaming Arcade': 'gamingArcade',
    'Surf Shop': 'surfShop',
    'Antiques Store': 'antiquesStore',
    'Bubble Tea Shop': 'bubbleTeaShop',
    'Cat Café': 'catCafe',
    'Ice Bar': 'iceBar',
    'Comedy Club': 'comedyClub',
    'Luggage Storage': 'luggageStorage',
    'Basketball Courts': 'basketballCourts',
    'Casino': 'casino',
    'Ice Hockey Rink': 'iceHockeyRink',
    'Phone Store': 'phoneStore',
    'Health Clinic': 'healthClinic',
    'Gift Shop': 'giftShop',
    'Fish & Chips': 'fishAndChips',
    'Florist': 'florist',
    'Coffee Shop': 'coffeeShop',
    'Karaoke Bar': 'karaokeBar',
    'Pub': 'pub',
    'Swimming Pool': 'swimmingPool',
    'Toy Store': 'toyStore',
    'Ice Skating Rink': 'iceRink',
    'Sleeping Pods': 'sleepingPods',
    'Pizzeria': 'pizzeria',
    'Fast Food Joint': 'fastFoodJoint',
    'Photo Room': 'photoRoom',
    'Ice Cream Parlour': 'iceCreamParlour',
    'Laser Tag': 'laserTag',
    'Chess Club': 'chessClub',
    'Cocktail Bar': 'cocktailBar',
    'Car Rental': 'carRental',
    'Climbing Centre': 'climbingCentre',
    'Indoor Surfing': 'indoorSurfing',
    'Wrestling Arena': 'wrestlingArena',
    'Beer Store': 'beerStore',
    'Art Gallery': 'artGallery',
    'History Museum': 'historyMuseum',
    'Table Tennis Court': 'tableTennisCourt',
    'Hamburger Restaurant': 'hamburgerRestaurant',
    'Night Lounge': 'nightLounge',
    'Metal Bar': 'metalBar',
    'Steak House': 'steakHouse',
    'Hot Dog Restaurant': 'hotDogRestaurant',
    'Theatre': 'theatre',
    'Budget Hotel': 'budgetHotel',
    'Aquarium': 'aquarium',
    'Jazz Lounge': 'jazzBar',
    'Music Store': 'musicStore',
    'Dance Studio': 'danceStudio',
    'Rock Bar': 'rockBar',
    'Bed & Breakfast': 'bedAndBreakfast',
    'Live Music Lounge': 'liveMusicLounge',
    'Waffle House': 'waffleHouse',
    'Shoe Store': 'shoeStore',
    'Jewellery Shop': 'jewelleryStore',
}

export const UPGRADE_KEY_MAP = {
    'Anniversary Sales': 'anniversarySales',
    'Prayer Room': 'prayerRoom',
    'Personal Styling Retinue': 'personalStylingRetinue',
    'Local Airport Links': 'localAirportLinks',
    'Billboard Design Overhauls': 'billboardDesignOverhauls',
    'Southern Hemisphere Trade Agreements': 'southernHemisphereTradeAgreements',
    'Terminal Radio': 'terminalRadio',
    'Train Station': 'trainStation',
    'Quiet Room': 'quietRoom',
    'Bank': 'bank',
    'Event Hall': 'eventHall',
    'Staff Cafeteria Renovations': 'staffCafeteriaRenovations',
    'Indoor Garden': 'indoorGarden',
    'Postal Office': 'postOffice',
    'Business Lounge Renovations': 'businessLoungeRenovations',
    'Anti-Littering Campaign': 'antiLitteringCampaign',
    'Hyperloop Pod Refurbishments': 'hyperloopPodRefurbishments',
    'Customer Service Centre': 'customerServiceCentre',
    'Plush Terminal Seating': 'plushTerminalSeating',
    'Soda Machines': 'sodaMachines',
    'Taxi Depot': 'taxiDepot',
    'Free Staff Breakfasts': 'freeStaffBreakfasts',
    'Mural Commissions': 'muralCommissions',
    'Palatial Interior Renovations': 'palatialInteriorRenovations',
    'Free Phone Charging Stations': 'freePhoneChargingStations',
    'Cross-Terminal Rickshaw Service': 'crossTerminalRickshawService',
    'Uniform Redesign': 'uniformRedesign',
    'Complementary Onboard Coffee': 'complementaryOnboardCoffee',
    'Christmas Day Festival': 'christmasDayFestival',
    'Fine Whisky Imports': 'fineWhiskyImports',
    'Water Taxi Transfers': 'waterTaxiTransfers',
    'Bus Transfers': 'busTransfers',
    'Experimental Technology': 'experimentalTechnology',
    'Personal Image Branding': 'personalImageBranding',
    'Superior Coffee Imports': 'superiorCoffeeImports',
    'Crime Prevention Campaign': 'crimePreventionCampaign',
    'Embassy Hotline Centre': 'embassyHotlineCentre',
    'Halloween Fair': 'halloweenFair',
    'Improved Restroom Facilities': 'improvedRestroomFacilities',
    'Currency Exchange Centre': 'currencyExchangeCentre',
    "New Year's Celebrations": 'newYearsCelebrations',
    'Fourth of July Shows': 'fourthOfJulyShows',
    "Valentine's Day Sales": 'valentinesDaySales',
    'Easter Weekend Deals': 'easterWeekendDeals',
    'Tram Depot': 'tramDepot',
    'Ferry Terminal': 'ferryTerminal',
    'Integrated Metro System': 'integratedMetroSystem',
    'Travel Agency': 'travelAgency',
    'Emergency Training': 'emergencyTraining',
    'Expanded Duty-Free': 'expandedDutyFree',
    'Outdoor Garden': 'outdoorGarden',
    'Dedicated Motorcycle Parking': 'dedicatedMotorcycleParking',
    'Local Tours': 'localTours',
    'Expanded Parking Facilities': 'expandedParkingFacilities',
    'Information Centre': 'informationCentre',
    'Nighttime Pay Incentives': 'nighttimePayIncentives',
    'Evening Staff Meal Tickets': 'eveningStaffMealTickets',
    'Complementary Afternoon Staff Meals': 'complementaryAfternoonStaffMeals',
    'Passenger Loyalty Scheme': 'passengerLoyaltyScheme',
    'Credit Card Lounges': 'creditCardLounges',
    'Business-Class Cabins': 'businessClassCabins',
    "Workers' Solidarity Fund": 'workersSolidarityFund',
}

// Prestige upgrades with their own posts (bought with Prestige Points, not built in a city)
const PRESTIGE_POST_MAP = {
    staffFeedbackForms: 'staffFeedbackForms',
    livestreamEverything: 'livestreamEverything',
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

const MONTH_NAMES = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
]

function getMonthCategory() {
    return MONTH_NAMES[new Date().getMonth()]
}

// All the posts about the developments and upgrades the player owns share this weight, however many they own,
// so they make up roughly 1 post in 5 (the everyday categories weigh about 15 between them). Each line can come
// back once it hasn't been used for 3 hours, like any other post. They used to fire once per development per run,
// so most lines were never seen, and every owned development competed at once: they flooded the start of a run
// and then stopped.
const OWNED_POSTS_WEIGHT = 4

// Ranks that have their own milestone posts (the list is `milestone<rank>` in hyperLinkData.js). To add one, add the
// rank here and the list there. A milestone shows from that rank until MILESTONE_WINDOW ranks after it; the weight is
// higher than the old 1 so that the short window is reliably seen.
const MILESTONE_RANKS = [10, 50]
const MILESTONE_WINDOW = 4
const MILESTONE_WEIGHT = 4

// Easter Sunday of a year (the same calculation the Easter Weekend Deals bonus uses)
function easterSunday(year) {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    return new Date(year, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1)
}

// Posts that only make sense around their date (the upgrade owner still gets them, just not in July):
// Halloween Fair 25-31 October, Christmas Day Festival 20-26 December, Fourth of July Shows 2-5 July, Valentine's Day
// Sales 10-14 February, New Year's Celebrations 28 December-2 January, Easter Weekend Deals Good Friday-Easter Monday.
const OWNED_POST_WINDOWS = {
    halloweenFair: d => d.getMonth() === 9 && d.getDate() >= 25,
    christmasDayFestival: d => d.getMonth() === 11 && d.getDate() >= 20 && d.getDate() <= 26,
    fourthOfJulyShows: d => d.getMonth() === 6 && d.getDate() >= 2 && d.getDate() <= 5,
    valentinesDaySales: d => d.getMonth() === 1 && d.getDate() >= 10 && d.getDate() <= 14,
    newYearsCelebrations: d => (d.getMonth() === 11 && d.getDate() >= 28) || (d.getMonth() === 0 && d.getDate() <= 2),
    // Easter moves every year: from Good Friday to Easter Monday
    easterWeekendDeals: d => {
        const easter = easterSunday(d.getFullYear())
        const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
        const days = Math.round((day - easter) / 86400000)
        return days >= -2 && days <= 1
    },
}

function buildEligibleCategories(gameState) {
    const {
        purchasedCities, purchasedDevelopments, purchasedUpgrades,
        activeEvent, schedule, trigger, rankSet,
    } = gameState

    const cats = []
    const add = (category, weight, data = {}) => cats.push({ category, weight, data })

    add('general', 2)
    add('officialGeneral', 5)
       add(getTimeCategory(), 3)
    add(getDayCategory(), 2)
    const monthCategory = getMonthCategory()
    if (POSTS[monthCategory]?.length) add(monthCategory, 2)

    if (trigger) add(trigger.type, 25, trigger.data || {})

    if (schedule?.length) {
        schedule.forEach(entry => {
            const diff = minutesUntilDeparture(entry)
            if (diff > 10 && diff <= 30) add('boarding', 4, { boardingCity: entry.name, gateNumber: entry.gate })
            if (diff > 5 && diff <= 10) add('finalCall', 6, { finalCallCity: entry.name, gateNumber: entry.gate })
            if (diff > 0 && diff <= 45 && diff > 30) add('goToGate', 3, { goToGateCity: entry.name, gateNumber: entry.gate })
            if (diff < 0 && diff > -60) add('departed', 3, { departedCity: entry.name })
        })
    }

    if (activeEvent?.type === 'positive') add('positiveEvent', 4)
    if (activeEvent?.type === 'negative') add('negativeEvent', 4)

    // Passengers react to the specific event, using its id to find their posts
    const reactionKey = activeEvent?.id ? 'event_' + activeEvent.id : null
    if (reactionKey && POSTS[reactionKey]?.length) {
        add(reactionKey, 6, { occasion: activeEvent.occasion })
    }
    if (gameState.reputation < 40) add('lowReputation', 3)
    if (gameState.reputation > 200) add('highReputation', 3)

       // Upgrades count as well as developments: every Enterprise item and most Service items are
    // upgrades, so counting only developments meant the "grow the company" and "lack of services"
    // posts never stopped (bug #111).
    const built = [...purchasedDevelopments, ...(purchasedUpgrades || [])]
    const builtIn = category => built.filter(d => d.category === category).length

    const foodCount = builtIn('Food')
    if (foodCount === 0) add('noFood', 3)
    else if (foodCount > 10) add('manyFood', 2)

    const shoppingCount = builtIn('Shopping')
    if (shoppingCount === 0) add('noShopping', 2)
    else if (shoppingCount > 10) add('manyShopping', 2)
    if (builtIn('Recreation') === 0) add('noRecreation', 2)
    if (builtIn('Service') === 0) add('noService', 2)
    if (builtIn('Enterprise') === 0) add('noEnterprise', 2)

    if (purchasedCities.length < 10) add('fewCities', 2)

    const adCampaigns = purchasedUpgrades.filter(u => u.effectType === 'countryAdvertisingBoost')
    if (adCampaigns.length > 0) {
        const campaign = adCampaigns[Math.floor(Math.random() * adCampaigns.length)]
        add('advertisingCampaign', 2, { campaignCountry: campaign.country })
    }

    // A rank milestone's posts are about reaching that rank, so they only show from the rank itself until a few ranks later
    for (const rank of MILESTONE_RANKS) {
        const key = `milestone${rank}`
        if (POSTS[key]?.length && rankSet >= rank && rankSet <= rank + MILESTONE_WINDOW) add(key, MILESTONE_WEIGHT)
    }

    const ownedKeys = [...new Set([
        ...purchasedDevelopments.map(dev => DEV_KEY_MAP[dev.name]),
        ...purchasedUpgrades.map(upg => UPGRADE_KEY_MAP[upg.name]),
        ...Object.entries(PRESTIGE_POST_MAP).filter(([id]) => PrestigeManager.owns(id)).map(([, key]) => key),
    ])].filter(key => key && POSTS[key]?.length && (!OWNED_POST_WINDOWS[key] || OWNED_POST_WINDOWS[key](new Date())))
    ownedKeys.forEach(key => add(key, OWNED_POSTS_WEIGHT / ownedKeys.length))

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

// A hashtag can't contain spaces or punctuation: "#{city}" with "Monte Carlo" must become
// "#MonteCarlo", not "#Monte Carlo". Letters (including accented ones) and digits are kept.
const toHashtag = value => String(value ?? '').replace(/[^\p{L}\p{N}]/gu, '')

function substituteText(text, data, gameState) {
    const { terminalName, homeCity, purchasedCities } = gameState
    const now = new Date()
    const hashtagValues = {
        terminalName,
        city: data.city,
        boardingCity: data.boardingCity,
        finalCallCity: data.finalCallCity,
        goToGateCity: data.goToGateCity,
        departedCity: data.departedCity,
        delayedCity: data.delayedCity,
        gateNumber: data.gateNumber,
    }
    return text
        .replace(/#\{(\w+)\}/g, (match, key) => key in hashtagValues ? '#' + toHashtag(hashtagValues[key]) : match)
        // The terminal name is typed by the player, so it's inserted with a function: as a plain
        // replacement string, '$&' or '$1' in the name would be read as a pattern.
        .replace(/\{terminalName\}/g, () => terminalName)
        .replace(/\{homeCity\}/g, () => homeCity?.name || terminalName)
        .replace(/\{city\}/g, data.city || purchasedCities[purchasedCities.length - 1]?.name || 'the new city')
        .replace(/\{CITY\}/g, (data.city || '').toUpperCase())
        .replace(/\{boardingCity\}/g, data.boardingCity || '')
        .replace(/\{finalCallCity\}/g, data.finalCallCity || '')
        .replace(/\{goToGateCity\}/g, data.goToGateCity || '')
        .replace(/\{departedCity\}/g, data.departedCity || '')
        .replace(/\{occasion\}/g, data.occasion || 'the big event')
        .replace(/\{delayedCity\}/g, data.delayedCity || '')
        .replace(/\{gateNumber\}/g, data.gateNumber || '')
        .replace(/\{campaignCountry\}/g, data.campaignCountry || '')
        .replace(/\{store\}/g, data.store ? inPost(data.store) : 'new store')
        .replace(/\{recreation\}/g, data.recreation ? inPost(data.recreation) : 'new attraction')
        .replace(/\{service\}/g, data.service ? inPost(data.service) : 'new service')
        .replace(/\{food\}/g, data.food ? inPost(data.food) : 'new restaurant')
        .replace(/\{development\}/g, data.development ? inPost(data.development) : 'the development')
        // Unlike {development} (a category like "Pharmacy", written as an ordinary word), a development's
        // player-given name is a proper name and keeps its own capitals — so it skips inPost(), and (like
        // {terminalName}) is inserted with a function so a '$' in a chosen name can't be read as a pattern.
        // A development that was never renamed has no name of its own, so it reads as "the pharmacy".
        .replace(/\{developmentName\}/g, () => data.developmentName || (data.development ? 'the ' + inPost(data.development) : 'the development'))
        .replace(/\{currentTime\}/g, now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        .replace(/\{cityCount\}/g, purchasedCities.length)
}

// Returns only the picture's id (e.g. "male_12"); the phone looks the image up when it draws the post (bug #134).
// From a list of {id,...}, picks the one used longest ago (never used counts as longest), and a
// random one among equals, so fresh content always goes first and the rest come round in order (bug #71).
function pickLeastRecent(items, lastUsed = {}) {
    let oldest = Infinity
    for (const it of items) oldest = Math.min(oldest, lastUsed[it.id] || 0)
    const tied = items.filter(it => (lastUsed[it.id] || 0) === oldest)
    return tied[Math.floor(Math.random() * tied.length)]
}

function generateUser(gender, usedPfps, pfpLastUsed = {}) {
    const useReal = Math.random() < 0.85
    if (!useReal) return { pfpId: 'default' }

    const pool = gender === 'male' ? MALE_PFPS : FEMALE_PFPS
    const available = pool
        .map((_, i) => ({ id: `${gender}_${i}` }))
        .filter(p => !usedPfps.includes(p.id))

    if (available.length === 0) return { pfpId: 'default' }

    return { pfpId: pickLeastRecent(available, pfpLastUsed).id }
}

export function generateHyperLinkPost(gameState) {
    const { terminalName, usedPostIds, usedMonthPostIds = [], usedPfps, trigger, templateLastUsed = {}, pfpLastUsed = {} } = gameState

    // Categories whose templates are all in use are left out of the draw, so a pick is never wasted
    // on one that cannot produce a post (bug #71).
    const hasTemplateLeft = c => (POSTS[c.category] || []).some((_, i) => {
        const id = `${c.category}_${i}`
        return !usedPostIds.includes(id) && !(MONTH_NAMES.includes(c.category) && usedMonthPostIds.includes(id))
    })
    const cats = buildEligibleCategories(gameState).filter(hasTemplateLeft)
    if (cats.length === 0) return null

    // A post about something that just happened always goes out when it has a template left,
    // instead of competing with the ordinary categories (bug #135).
    const triggerCat = trigger ? cats.find(c => c.category === trigger.type) : null
    const triggerHasPosts = triggerCat && (POSTS[triggerCat.category] || [])
        .some((_, i) => !usedPostIds.includes(`${triggerCat.category}_${i}`))
    const selected = triggerHasPosts ? triggerCat : pickCategory(cats)

    if (selected.category === 'officialGeneral') {
        const pool = POSTS.officialGeneral || []
        const available = pool.map((text, i) => ({ id: `officialGeneral_${i}`, text }))
            .filter(p => !usedPostIds.includes(p.id))
        if (available.length === 0) return null
        const chosen = pickLeastRecent(available, templateLastUsed)
        return {
            id: `post_${Date.now()}_${Math.random()}`,
            text: substituteText(chosen.text, {}, gameState),
            displayName: terminalName,
            handle: `@${terminalName.toLowerCase().replace(/[^a-z0-9]/g, '')}official`,
            isOfficial: true,
            isItalic: false,
            timestamp: Date.now(),
            usedPostId: chosen.id,
            usedPfpId: 'official',
        }
    }

        const categoryPosts = POSTS[selected.category]
    if (!categoryPosts?.length) return null

    const isMonthPost = MONTH_NAMES.includes(selected.category)
    const available = categoryPosts
        .map((text, i) => ({ id: `${selected.category}_${i}`, text }))
        // Month posts have tiny pools (4-5 templates) that stay eligible for a whole month, so on
        // top of the normal "already in the last-2-days feed" check, also exclude anything already
        // shown this calendar year. Otherwise the same handful of posts would cycle every couple of
        // days for the entire month instead of each firing once before next year's version of it.
        .filter(p => !usedPostIds.includes(p.id) && !(isMonthPost && usedMonthPostIds.includes(p.id)))

    if (available.length === 0) return null

    const chosenPost = pickLeastRecent(available, templateLastUsed)
    const gender = Math.random() < 0.5 ? 'male' : 'female'
    const firstName = gender === 'male'
        ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
        : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)]
    const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)]
    const displayName = `${firstName} ${surname}`
    const handle = `@hyper-linkuser${Math.floor(10000000 + Math.random() * 90000000)}`

    const { pfpId } = generateUser(gender, usedPfps, pfpLastUsed)

    const isItalic = chosenPost.text.startsWith('*(') && chosenPost.text.endsWith(')*')
    const cleanText = isItalic ? chosenPost.text.slice(2, -2) : chosenPost.text

    return {
        id: `post_${Date.now()}_${Math.random()}`,
        text: substituteText(cleanText, selected.data, gameState),
        displayName,
        handle,
        isOfficial: false,
        isItalic,
        timestamp: Date.now(),
        usedPostId: chosenPost.id,
        usedPfpId: pfpId,
        gender,
        monthPostId: isMonthPost ? chosenPost.id : null,
    }
}

export function generateOfficialEventPost(gameState) {
    const { trigger, terminalName } = gameState
    if (!trigger) return null

    let pool = null
    if (trigger.type === 'officialDelay') {
        pool = POSTS.officialDelay
    } else if (trigger.type === 'officialDelayCompensated') {
        pool = POSTS.officialDelayCompensated
    } else if (trigger.type === 'officialEvent') {
        const eventId = trigger.data?.eventId
        pool = eventId ? POSTS.officialEvent?.[eventId] : null
    }

    if (!pool?.length) return null
    const text = pool[Math.floor(Math.random() * pool.length)]
    const substituted = text
        .replace(/\{terminalName\}/g, () => terminalName)
        .replace(/\{occasion\}/g, trigger.data?.occasion || 'the big event')
        .replace(/\{delayedCity\}/g, trigger.data?.delayedCity || '')
        .replace(/\{cityCount\}/g, gameState.purchasedCities?.length || 0)

    return {
        id: `post_${Date.now()}_${Math.random()}`,
        text: substituted,
        displayName: terminalName,
        handle: `@${terminalName.toLowerCase().replace(/[^a-z0-9]/g, '')}official`,
        isOfficial: true,
        isItalic: false,
        timestamp: Date.now(),
        usedPostId: null,
        usedPfpId: 'official',
    }
}