// The Prestige upgrade tree. Four layers; every upgrade in a layer must be owned before the
// next layer opens. A layer's upgrades all cost the same.
// Effects are listed as plain text for the tree page; they are wired into the game one by one.

export const PRESTIGE_LAYERS = [
    { layer: 1, cost: 1 },
    { layer: 2, cost: 2 },
    { layer: 3, cost: 3 },
    { layer: 4, cost: 5 },
]

// Upgrades whose effect is not in the game yet, with what each one is waiting for.
// Anything not listed here is live. Keep Managers/PrestigeManager/PRESTIGE_STATUS.md in step.
export const NOT_IMPLEMENTED = {
}

// The perks' strengths. Each is a true multiplier, applied after the ordinary boosts have been added up, so a perk
// keeps its full effect however many other boosts are owned (bug #147). The descriptions below are built from these.
export const PRESTIGE_VALUES = {
    staffFeedbackForms: 2,             // x2 city and development income
    irresistibleDiscounts: 3,          // x3 development income
    globalTicketCuts: 3,               // x3 city income
    trophyCabinetPerAchievement: 0.02, // x(1 + 2% per unique achievement)
    generationalWisdomPerPoint: 0.05,  // x(1 + 5% per Prestige Point held)
    speedyConveyorBelts: 2,            // x2 Work earnings
    oralHygiene: 6,                    // x6 Reputation from farewells
    viralSuperstar: 3,                 // x3 Progress rewards
    livestreamRep: 5,                  // Livestream Everything: Reputation paid ...
    livestreamEvery: 100,              // ... every this many manual Work clicks in a run
    streamingMasteryFactor: 2,         // Streaming Mastery: the bonus is doubled ...
    streamingMasteryEvery: 50,         // ... and paid every this many clicks instead
    signOnBonus: 1000000,              // Sign-On Bonus: extra cash at the start of every new run
    pizzaParties: 2,                   // x2 positive event strength
}
const mult = v => `x${v}`
const pct = v => `${Math.round(v * 100)}%`
const money = v => `£${v.toLocaleString('en-GB')}`
const V = PRESTIGE_VALUES

export const PRESTIGE_UPGRADES = [
    // Layer 1
    { id: 'staffFeedbackForms', icon: '📝', layer: 1, name: 'Staff Feedback Forms', description: `${mult(V.staffFeedbackForms)} city and development income.` },
    { id: 'livestreamEverything', icon: '📡', layer: 1, name: 'Livestream Everything', description: `Guaranteed +${V.livestreamRep} Reputation every ${V.livestreamEvery} manual Work clicks (counted each run).` },
    { id: 'signOnBonus', icon: '✍️', layer: 1, name: 'Sign-On Bonus', description: `${money(V.signOnBonus)} extra cash when you start a new run.` },

    { id: 'legalLoopholes', icon: '📑', layer: 1, name: 'Legal Loopholes', description: `Renaming a development costs half the Reputation.` },
    { id: 'amicableBreakups', icon: '🤝', layer: 1, name: 'Amicable Breakups', description: 'Disconnecting a city or removing a development costs nothing and refunds half the cost.' },

    // Layer 2
    { id: 'colourTheory', icon: '🎨', layer: 2, name: 'Colour Theory', description: 'Developments start with a Level 1 upgrade when built.'},
    { id: 'oralHygiene', icon: '🦷', layer: 2, name: 'Oral Hygiene', description: `${mult(V.oralHygiene)} Reputation from farewells.` },
    { id: 'betterInterestRates', icon: '🏦', layer: 2, name: 'Better Interest Rates', description: 'x10 cash from the daily bonus.' },
    { id: 'eliteAccountants', icon: '🧮', layer: 2, name: 'Elite Accountants', description: 'The optional double bonus when claiming offline earnings becomes a quadruple bonus, for the same cost.' },
    { id: 'cultOfCelebrity', icon: '❤️', layer: 2, name: 'Cult of Celebrity', description: 'Liking a Hyper-Link post now gives 1 Reputation.' },
    { id: 'goodStanding', icon: '🎖️', layer: 2, name: 'Good Standing', description: 'Upgrading developments costs no Reputation.' },
    { id: 'advancedEngineering', icon: '🏗️', layer: 2, name: 'Advanced Engineering', description: 'Cities and developments are constructed immediately.' },
    { id: 'videoMessage', icon: '🎥', layer: 2, name: 'Video Message', description: 'Farewells and greetings are accepted automatically.' },
    { id: 'viralSuperstar', icon: '🌟', layer: 2, name: 'Viral Superstar', description: `${mult(V.viralSuperstar)} cash and Reputation from Progress rewards.` },

    // Layer 3
    { id: 'automatedScheduling', icon: '🗓️', layer: 3, name: 'Skeleton Staff', description: 'No cap on offline earnings.' },
    { id: 'trophyCabinet', icon: '🏆', layer: 3, name: 'Trophy Cabinet', description: `City and development income multiplied by an extra ${pct(V.trophyCabinetPerAchievement)} for each unique achievement unlocked (x${1 + 50 * V.trophyCabinetPerAchievement} at 50).` },
    { id: 'pizzaParties', icon: '🍕', layer: 3, name: 'Pizza Parties', description: 'Positive events are twice as strong.' },
    { id: 'irresistibleDiscounts', icon: '🏷️', layer: 3, name: 'Irresistible Discounts', description: `${mult(V.irresistibleDiscounts)} development income.` },
    { id: 'bulletproofPlanning', icon: '🛡️', layer: 3, name: 'Bulletproof Planning', description: 'No more delays, ever.' },
    { id: 'foundersHallExpansion', icon: '🏛️', layer: 3, name: 'Founders\' Hall Expansion', description: '+1% extra from the Founders\' Hall bonus.' },
    { id: 'personalFavours', icon: '🎁', layer: 3, name: 'Personal Favours', description: 'Choose any city in the world as your starting city every run.' },
    { id: 'vipPods', icon: '🚀', layer: 3, name: 'VIP Pods', description: 'x10 VIP chance.' },

    { id: 'fiveStarResearchers', icon: '🔬', layer: 3, name: 'Five-Star Researchers', description: 'Experimental Technology rewards double the Prestige Points (10 instead of 5).' },

    // Layer 4
    { id: 'fastLearner', icon: '🎓', layer: 4, name: 'Fast Learner', description: '+1 Prestige Point for every 1 Prestige Point gained.' },
    { id: 'governmentGrants', icon: '🏛️', layer: 4, name: 'Government Grants', description: 'Start at Rank 25, with 24 cities and developments already unlocked.' },
    { id: 'speedyConveyorBelts', icon: '⚙️', layer: 4, name: 'Speedy Conveyor Belts', description: `${mult(V.speedyConveyorBelts)} Work earnings.` },
    { id: 'globalTicketCuts', icon: '🎫', layer: 4, name: 'Global Ticket Cuts', description: `${mult(V.globalTicketCuts)} city income.` },
    { id: 'bestPAEver', icon: '🧑‍💼', layer: 4, name: 'Best P.A. Ever', description: 'Work clicks itself once every 500ms.' },
    { id: 'lobbyingSuavity', icon: '🕶️', layer: 4, name: 'Lobbying Suavity', description: 'Choose any city to connect when ranking up.' },
    { id: 'generationalWisdom', icon: '📜', layer: 4, name: 'Generational Wisdom', description: `City and development income multiplied by an extra ${pct(V.generationalWisdomPerPoint)} for every Prestige Point you currently hold (x${1 + 10 * V.generationalWisdomPerPoint} with 10).` },
    { id: 'streamingMastery', icon: '🎬', layer: 4, name: 'Streaming Mastery', description: `The Livestream Everything bonus is doubled, and now paid every ${V.streamingMasteryEvery} manual Work clicks instead of every ${V.livestreamEvery}.` },
    { id: 'crisisAvoidanceSpecialists', icon: '🚨', layer: 4, name: 'Crisis Avoidance Specialists', description: 'No negative events, ever.' },
].map(u => ({
    ...u,
    cost: PRESTIGE_LAYERS.find(l => l.layer === u.layer).cost,
    implemented: !(u.id in NOT_IMPLEMENTED),
    pendingNote: NOT_IMPLEMENTED[u.id] || null,
}))
