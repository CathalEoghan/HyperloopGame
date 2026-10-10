// The achievement list. Each one unlocks for good (it survives prestige) and counts towards Anniversary Sales
// (+5% work each) and Trophy Cabinet (+25% income each).
//
// State achievements have a `check(ctx)` that is run every second against a snapshot of the game (see
// AchievementManager.buildContext). Event achievements have no check and are unlocked with `unlock(id)` where it happens.
// `pending` marks one that can't be earned yet because the feature behind it isn't in the game.

const atLeast = (key, n) => ctx => ctx[key] >= n
const built = (cat, n) => ctx => (ctx.categories[cat] || 0) >= n

export const ACHIEVEMENTS = [
    // Cities
    { id: 'firstSteps', group: 'Cities', name: 'First Steps', description: 'Connect your first city.', check: atLeast('cities', 1) },
    { id: 'connected', group: 'Cities', name: 'Connected', description: 'Connect 10 cities.', check: atLeast('cities', 10) },
    { id: 'wellConnected', group: 'Cities', name: 'Well-Connected', description: 'Connect 100 cities.', check: atLeast('cities', 100) },
    { id: 'trulyGlobal', group: 'Cities', name: 'Truly Global', description: 'Connect every city.', check: ctx => ctx.regularTotal > 0 && ctx.regularConnected >= ctx.regularTotal },
    { id: 'topSecret', group: 'Cities', name: 'Top Secret', description: 'Connect the last city.', check: ctx => ctx.secretConnected },
    { id: 'diverse', group: 'Cities', name: 'Diverse', description: 'Connect to 10 unique countries.', check: atLeast('countries', 10) },

    // Developments
    { id: 'developing', group: 'Developments', name: 'Developing', description: 'Construct your first development.', check: atLeast('builds', 1) },
    { id: 'developed', group: 'Developments', name: 'Developed', description: 'Construct 10 developments.', check: atLeast('builds', 10) },
    { id: 'neverADullMoment', group: 'Developments', name: 'Never a Dull Moment', description: 'Construct 100 developments.', check: atLeast('builds', 100) },
    { id: 'bigSpender', group: 'Developments', name: 'Big Spender', description: 'Construct 10 Shopping-category developments.', check: built('Shopping', 10) },
    { id: 'funTimes', group: 'Developments', name: 'Fun Times', description: 'Construct 10 Recreation-category developments.', check: built('Recreation', 10) },
    { id: 'bossy', group: 'Developments', name: 'Bossy', description: 'Construct 10 Enterprise-category developments.', check: built('Enterprise', 10) },
    { id: 'serviced', group: 'Developments', name: 'Serviced', description: 'Construct 10 Service-category developments.', check: built('Service', 10) },
    { id: 'foodie', group: 'Developments', name: 'Foodie', description: 'Construct 10 Food-category developments.', check: built('Food', 10) },
    { id: 'engineer', group: 'Developments', name: 'Engineer', description: 'Construct 10 Infrastructure-category developments.', check: built('Infrastructure', 10) },

    // Hyper-Link
    { id: 'iLikeIt', group: 'Hyper-Link', name: 'I Like It', description: 'Like a Hyper-Link post.', check: atLeast('likes', 1) },
    { id: 'socialMediaAddict', group: 'Hyper-Link', name: 'Social Media Addict', description: 'Like 100 Hyper-Link posts.', check: atLeast('likes', 100) },
    { id: 'shutUp', group: 'Hyper-Link', name: 'Shut Up!', description: 'Mute Hyper-Link.' },

    // Farewells
    { id: 'veryImportantPerson', group: 'Farewells', name: 'Very Important Person', description: 'Give a farewell to a VIP passenger.' },
    { id: 'niceManager', group: 'Farewells', name: 'Nice Manager', description: 'Give a farewell.', check: atLeast('farewells', 1) },
    { id: 'greatManager', group: 'Farewells', name: 'Great Manager', description: 'Give a total of 10 farewells.', check: atLeast('farewells', 10) },
    { id: 'bestManagerEver', group: 'Farewells', name: 'Best Manager Ever', description: 'Give a total of 100 farewells.', check: atLeast('farewells', 100) },

    // Money
    { id: 'firstMillion', group: 'Money', name: 'First Million', description: 'Have a total of 2 million in your treasury.', check: atLeast('balance', 2e6) },
    { id: 'billionaire', group: 'Money', name: 'Billionaire', description: 'Have a total of 1 billion in your treasury.', check: atLeast('balance', 1e9) },
    { id: 'trillionaire', group: 'Money', name: 'Trillionaire', description: 'Have a total of 1 trillion in your treasury.', check: atLeast('balance', 1e12) },

    // Work
    { id: 'hardWorker', group: 'Work', name: 'Hard Worker', description: 'Press the Work button 100 times.', check: atLeast('work', 100) },
    { id: 'industrious', group: 'Work', name: 'Industrious', description: 'Press the Work button 1000 times.', check: atLeast('work', 1000) },
    { id: 'workaholic', group: 'Work', name: 'Workaholic', description: 'Press the Work button 10,000 times.', check: atLeast('work', 10000) },

    // Ranks
    { id: 'makingProgress', group: 'Ranks', name: 'Making Progress', description: 'Reach Rank 10.', check: atLeast('rank', 10) },
    { id: 'gettingThere', group: 'Ranks', name: 'Getting There!', description: 'Reach Rank 25.', check: atLeast('rank', 25) },
    { id: 'establishedTerminal', group: 'Ranks', name: 'Established Terminal', description: 'Reach Rank 50.', check: atLeast('rank', 50) },
    { id: 'famousTerminal', group: 'Ranks', name: 'Famous Terminal', description: 'Reach Rank 100.', check: atLeast('rank', 100) },
    { id: 'theLongHaul', group: 'Ranks', name: 'The Long Haul', description: 'Reach Rank 200.', check: atLeast('rank', 200) },

    // Prestige
    { id: 'prestigious', group: 'Prestige', name: 'Prestigious', description: 'Earn a Prestige Point.', check: ctx => ctx.prestigeEarned },
    { id: 'absurdGains', group: 'Prestige', name: 'Absurd Gains', description: 'Unlock 10 Prestige upgrades.', check: atLeast('prestigeOwned', 10) },
    { id: 'bestOfTheBest', group: 'Prestige', name: 'Best of the Best', description: 'Unlock every Prestige upgrade.', check: ctx => ctx.prestigeOwned >= ctx.prestigeTotal },
    { id: 'happyRetirement', group: 'Prestige', name: 'Happy Retirement!', description: 'Retire for the first time.' },

    // Secrets
    { id: 'surprise', group: 'Secrets', name: 'Surprise!', description: 'Claim the surprise in the credits section.' },
]

export const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map(a => a.id))
export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]))
