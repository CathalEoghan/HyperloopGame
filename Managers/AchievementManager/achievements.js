// The achievement list. Each one unlocks for good (it survives prestige) and counts towards Anniversary Sales
// (+5% work each) and Trophy Cabinet (+25% income each).
//
// State achievements have a `check(ctx)` that is run every second against a snapshot of the game (see
// AchievementManager.buildContext). Event achievements have no check and are unlocked with `unlock(id)` where it happens.
// `pending` marks one that can't be earned yet because the feature behind it isn't in the game.

const atLeast = (key, n) => ctx => ctx[key] >= n
const built = (cat, n) => ctx => (ctx.categories[cat] || 0) >= n
// Cities connected, and developments or upgrades built, at the same time (all of the names given)
const connected = (...names) => ctx => names.every(n => ctx.cityNames.includes(n))
const developed = (...names) => ctx => names.every(n => ctx.builtNames.includes(n))
const developedAndConnected = (dev, city) => ctx => ctx.builtNames.includes(dev) && ctx.cityNames.includes(city)
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
// A loop line's length is in km here, whatever the player's Distance setting
const LONG_LOOP_KM = 10000
const SHORT_LOOP_KM = 200

export const ACHIEVEMENTS = [
    // Cities
    { id: 'firstSteps', group: 'Cities', name: 'First Steps', description: 'Connect your first city after your home city.', check: atLeast('cities', 2) },
    { id: 'connected', group: 'Cities', name: 'Connected', description: 'Connect 10 cities.', check: atLeast('cities', 10) },
    { id: 'wellConnected', group: 'Cities', name: 'Well-Connected', description: 'Connect 100 cities.', check: atLeast('cities', 100) },
    { id: 'trulyGlobal', group: 'Cities', name: 'Truly Global', description: 'Connect every city.', check: ctx => ctx.regularTotal > 0 && ctx.regularConnected >= ctx.regularTotal },
    { id: 'topSecret', group: 'Cities', name: 'Top Secret', description: 'Connect the last city.', check: ctx => ctx.secretConnected },
    { id: 'diverse', group: 'Cities', name: 'Diverse', description: 'Connect to 10 unique countries.', check: atLeast('countries', 10) },
    { id: 'moreDiverse', group: 'Cities', name: 'More Diverse', description: 'Connect to 50 unique countries.', check: atLeast('countries', 50) },
    // (Earned at 50 countries before More Diverse existed: those players keep it, and get More Diverse too)
    { id: 'evenMoreDiverse', group: 'Cities', name: 'Even More Diverse', description: 'Connect to 100 unique countries.', check: atLeast('countries', 100) },
    { id: 'continentalSpan', group: 'Cities', name: 'Continental Span', description: 'Connect a city on every continent in one run (excluding Antarctica).', check: ctx => ctx.continentsTotal > 0 && ctx.continents >= ctx.continentsTotal },
    { id: 'bestCityInTheWorld', group: 'Cities', name: 'Best City in the World', description: 'Connect Belfast to your network.', check: ctx => ctx.cityNames.includes('Belfast') },
    { id: 'noConnectionForYou', group: 'Cities', name: 'No Connection for You!', description: 'Disconnect a city.' },
    { id: 'islander', group: 'Cities', name: 'Islander', description: 'Start a run using Palikir or Apia as your home city.' },

    // Developments
    { id: 'developing', group: 'Developments', name: 'Developing', description: 'Construct your first development.', check: atLeast('builds', 1) },
    { id: 'developed', group: 'Developments', name: 'Developed', description: 'Construct 10 developments.', check: atLeast('builds', 10) },
    { id: 'wellDeveloped', group: 'Developments', name: 'Well-Developed', description: 'Construct 50 developments.', check: atLeast('builds', 50) },
    { id: 'neverADullMoment', group: 'Developments', name: 'Never a Dull Moment', description: 'Construct 100 developments.', check: atLeast('builds', 100) },
    { id: 'underNewManagement', group: 'Developments', name: 'Under New Management', description: 'Rename a development.' },
    { id: 'hereTodayGoneTomorrow', group: 'Developments', name: 'Here Today, Gone Tomorrow', description: 'Remove a development.' },
    { id: 'upgraded', group: 'Developments', name: 'Upgraded', description: 'Upgrade a city or development for the first time.', check: atLeast('citiesAndDevUpgrades', 1) },
    { id: 'renovator', group: 'Developments', name: 'Renovator', description: 'Upgrade cities or developments 10 times.', check: atLeast('citiesAndDevUpgrades', 10) },
    { id: 'starArchitect', group: 'Developments', name: 'Star Architect', description: 'Upgrade cities or developments 50 times.', check: atLeast('citiesAndDevUpgrades', 50) },
    { id: 'universalBrand', group: 'Developments', name: 'Universal Brand', description: 'Develop the advertising campaign for every country.', check: ctx => ctx.adCampaignsTotal > 0 && ctx.adCampaignsOwned >= ctx.adCampaignsTotal },
    { id: 'allYearRound', group: 'Developments', name: 'All-Year Round', description: 'Develop the ticket deals for every month.', check: developed(...MONTHS.map(m => `${m} Ticket Deals`)) },
    { id: 'bigSpender', group: 'Developments', name: 'Big Spender', description: 'Construct 10 Shopping-category developments.', check: built('Shopping', 10) },
    { id: 'funTimes', group: 'Developments', name: 'Fun Times', description: 'Construct 10 Recreation-category developments.', check: built('Recreation', 10) },
    { id: 'bossy', group: 'Developments', name: 'Bossy', description: 'Construct 10 Enterprise-category developments.', check: built('Enterprise', 10) },
    { id: 'serviced', group: 'Developments', name: 'Serviced', description: 'Construct 10 Service-category developments.', check: built('Service', 10) },
    { id: 'foodie', group: 'Developments', name: 'Foodie', description: 'Construct 10 Food-category developments.', check: built('Food', 10) },
    { id: 'engineer', group: 'Developments', name: 'Engineer', description: 'Construct 10 Infrastructure-category developments.', check: built('Infrastructure', 10) },

    // Hyper-Link
    { id: 'iLikeIt', group: 'Hyper-Link', name: 'I Like It', description: 'Like a Hyper-Link post.', check: atLeast('likes', 1) },
    { id: 'socialMediaAddict', group: 'Hyper-Link', name: 'Social Media Addict', description: 'Like 100 Hyper-Link posts.', check: atLeast('likes', 100) },
    { id: 'doomscroller', group: 'Hyper-Link', name: 'Doomscroller', description: 'Like 250 Hyper-Link posts.', check: atLeast('likes', 250) },
    { id: 'cameo', group: 'Hyper-Link', name: 'Cameo', description: 'Like the Hyper-Link post featuring me.' },
    { id: 'shutUp', group: 'Hyper-Link', name: 'Shut Up!', description: 'Mute Hyper-Link.' },

    // Farewells
    { id: 'veryImportantPassenger', group: 'Farewells', name: 'Very Important Person', description: 'Give a farewell or a greeting to a VIP passenger.' },
    // (The id niceManager is kept so it stays unlocked for players who have it)
    { id: 'niceManager', group: 'Farewells', name: 'Goodbye!', description: 'Give a farewell.', check: atLeast('farewells', 1) },
    { id: 'welcome', group: 'Farewells', name: 'Welcome!', description: 'Greet the passengers of an arriving loop.', check: atLeast('greetings', 1) },
    // The bigger totals count farewells and greetings together
    { id: 'greatManager', group: 'Farewells', name: 'Great Manager', description: 'Give a total of 10 farewells and greetings.', check: atLeast('farewellsAndGreetings', 10) },
    { id: 'amazingManager', group: 'Farewells', name: 'Amazing Manager', description: 'Give a total of 50 farewells/greetings.', check: atLeast('farewellsAndGreetings', 50) },
    { id: 'bestManagerEver', group: 'Farewells', name: 'Best Manager Ever', description: 'Give a total of 100 farewells and greetings.', check: atLeast('farewellsAndGreetings', 100) },

    // Reputation
    { id: 'wellLiked', group: 'Reputation', name: 'Well-Liked', description: 'Have 1000 Reputation at any given time.', check: atLeast('reputation', 1000) },
    { id: 'loathed', group: 'Reputation', name: 'Loathed', description: 'Have 0 Reputation at any given time.', check: ctx => ctx.reputation <= 0 },

    // Daily bonus
    { id: 'welcomeBack', group: 'Daily bonus', name: 'Welcome Back', description: 'Collect your daily bonus for the first time.', check: atLeast('dailyBonus', 1) },
    { id: 'frequentLooper', group: 'Daily bonus', name: 'Frequent Looper', description: 'Collect your daily bonus 7 times.', check: atLeast('dailyBonus', 7) },

    // Delays
    { id: 'sorry', group: 'Delays', name: 'Sorry!', description: 'Compensate a delayed departure.' },
    { id: 'toughLuck', group: 'Delays', name: 'Tough Luck', description: 'Refuse to compensate a delayed departure.' },

    // Money
    { id: 'firstMillion', group: 'Money', name: 'First Million', description: 'Have a total of 2 million in your treasury.', check: atLeast('balance', 2e6) },
    { id: 'billionaire', group: 'Money', name: 'Billionaire', description: 'Have a total of 1 billion in your treasury.', check: atLeast('balance', 1e9) },
    { id: 'trillionaire', group: 'Money', name: 'Trillionaire', description: 'Have a total of 1 trillion in your treasury.', check: atLeast('balance', 1e12) },

    // Work
    { id: 'hardWorker', group: 'Work', name: 'Hard Worker', description: 'Press the Work button 100 times.', check: atLeast('work', 100) },
    { id: 'industrious', group: 'Work', name: 'Industrious', description: 'Press the Work button 1000 times.', check: atLeast('work', 1000) },
    { id: 'workaholic', group: 'Work', name: 'Workaholic', description: 'Press the Work button 10,000 times.', check: atLeast('work', 10000) },
    { id: 'yourPoorHand', group: 'Work', name: 'Your Poor Hand', description: 'Click 100,000 times.', check: atLeast('work', 100000) },
    // This run's manual Work clicks (it starts again with every run), so a player who has clicked before can still earn it
    { id: 'couchPotato', group: 'Work', name: 'Couch Potato', description: 'Get to Rank 100 without ever clicking the Work button.', check: ctx => ctx.rank >= 100 && ctx.runWork === 0 },

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

    // Passengers and time
    { id: 'gettingBusy', group: 'Passengers', name: 'Getting Busy', description: 'Have 20,000 passengers go through your terminal.', check: atLeast('passengers', 20000) },
    { id: 'crowded', group: 'Passengers', name: 'Crowded', description: 'Have 100,000 passengers go through your terminal.', check: atLeast('passengers', 100000) },
    { id: 'jamPacked', group: 'Passengers', name: 'Jam-Packed', description: 'Have 1 million passengers go through your terminal.', check: atLeast('passengers', 1e6) },
    { id: 'littleCity', group: 'Passengers', name: 'Little City', description: 'Have 10 million passengers go through your terminal.', check: atLeast('passengers', 1e7) },
    { id: 'areWeThereYet', group: 'Loops', name: 'Are We There Yet?', description: `Have an active loop line longer than ${LONG_LOOP_KM.toLocaleString('en-GB')}km.`, check: ctx => ctx.longestLoopKm > LONG_LOOP_KM },
    { id: 'justTakeTheBus', group: 'Loops', name: 'Just Take the Bus', description: `Have an active loop line shorter than ${SHORT_LOOP_KM}km.`, check: ctx => ctx.shortestLoopKm !== null && ctx.shortestLoopKm < SHORT_LOOP_KM },
    { id: 'beepBoop', group: 'Loops', name: 'Beep Boop', description: 'Automate a loop schedule.' },
    { id: 'wellAlwaysHaveParis', group: 'Loops', name: "We'll Always Have Paris", description: 'Give a farewell to a loop going to Paris from Casablanca.' },
    { id: 'soFancy', group: 'Loops', name: 'So Fancy', description: 'Give a farewell to a loop going to Tokyo from Los Angeles.' },
    { id: 'stirCrazy', group: 'Time', name: 'Stir Crazy', description: 'Play for a total of 24 hours.', check: atLeast('playtime', 24 * 3600) },
    { id: 'touchGrass', group: 'Time', name: 'Touch Grass', description: 'Play for a total of 168 hours.', check: atLeast('playtime', 168 * 3600) },
    { id: 'shoppingSpree', group: 'Shop', name: 'Shopping Spree', description: 'Buy something from the Shop.' },

    // Combinations: all of these at any one time
    { id: 'loopToBusan', group: 'Combinations', name: 'Loop to Busan', description: 'Have both Seoul and Busan connected at any one time.', check: connected('Seoul', 'Busan') },
    { id: 'weDidntStartTheFire', group: 'Combinations', name: "We Didn't Start the Fire", description: 'Have New York, Budapest and Berlin connected at any one time.', check: connected('New York', 'Budapest', 'Berlin') },
    { id: 'passengerConfusion', group: 'Combinations', name: 'Passenger Confusion', description: 'Have both San Jose and San José connected at any one time.', check: connected('San Jose', 'San José') },
    { id: 'royalFlush', group: 'Combinations', name: 'Royal Flush', description: 'Have Las Vegas, Macau and Monte Carlo connected at any one time.', check: connected('Las Vegas', 'Macau', 'Monte Carlo') },
    { id: 'warOfTheWoods', group: 'Combinations', name: "War of the 'Woods", description: 'Have Lagos, Mumbai and Los Angeles connected at any one time.', check: connected('Lagos', 'Mumbai', 'Los Angeles') },
    { id: 'welcomeToMadagascar', group: 'Combinations', name: 'Welcome to Madagascar', description: 'Have both New York and Antananarivo connected at any one time.', check: connected('New York', 'Antananarivo') },
    { id: 'animalLover', group: 'Combinations', name: 'Animal Lover', description: 'Have the Kennel, Petting Zoo and Cat Café all developed at any one time.', check: developed('Kennel', 'Petting Zoo', 'Cat Café') },
    { id: 'expressMail', group: 'Combinations', name: 'Express Mail', description: 'Have both the Postal Office and Expedited Shipping Logistics developed at any one time.', check: developed('Postal Office', 'Expedited Shipping Logistics') },
    { id: 'carriedAway', group: 'Combinations', name: 'Car-ried Away', description: 'Have the Car Museum, Car Accessories and Car Rental all developed at any one time.', check: developed('Car Museum', 'Car Accessories', 'Car Rental') },
    { id: 'theLapOfLuxury', group: 'Combinations', name: 'Lap of Luxury', description: 'Have both Hyperloop Pod Refurbishments and Complementary Onboard Coffee developed at any one time.', check: developed('Hyperloop Pod Refurbishments', 'Complementary Onboard Coffee') },
    { id: 'gardener', group: 'Combinations', name: 'Gardener', description: 'Have both Indoor Garden and Outdoor Garden developed at any one time.', check: developed('Indoor Garden', 'Outdoor Garden') },
    { id: 'waterPark', group: 'Combinations', name: 'Water Park', description: 'Have Indoor Surfing, Resort Hotel and Swimming Pool all developed at any one time.', check: developed('Indoor Surfing', 'Resort Hotel', 'Swimming Pool') },
    { id: 'mindAndBody', group: 'Combinations', name: 'Mind & Body', description: 'Have both Gym and Quiet Room developed at any one time.', check: developed('Gym', 'Quiet Room') },
    { id: 'theKims', group: 'Combinations', name: 'The Kims', description: 'Have Convenience Store developed and Toronto connected at any one time.', check: developedAndConnected('Convenience Store', 'Toronto') },
    { id: 'feministBookstore', group: 'Combinations', name: 'Feminist Bookstore', description: 'Have Bookstore developed and Portland connected at any one time.', check: developedAndConnected('Bookstore', 'Portland') },
    { id: 'inTheEastEnd', group: 'Combinations', name: 'In the East End', description: 'Have Pub developed and London connected at any one time.', check: developedAndConnected('Pub', 'London') },
    { id: 'sleepyInSeattle', group: 'Combinations', name: 'Sleepy in Seattle', description: 'Have Sleeping Pods developed and Seattle connected at any one time.', check: developedAndConnected('Sleeping Pods', 'Seattle') },
    { id: 'cheers', group: 'Combinations', name: 'Cheers', description: 'Have Pub developed and Boston connected at any one time.', check: developedAndConnected('Pub', 'Boston') },
    { id: 'trainspotting', group: 'Combinations', name: 'Trainspotting', description: 'Have Train Station developed and Edinburgh connected at any one time.', check: developedAndConnected('Train Station', 'Edinburgh') },
    { id: 'nineMillionMotorcycles', group: 'Combinations', name: 'Nine Million Motorcycles', description: 'Have Dedicated Motorcycle Parking developed and Beijing connected at any one time.', check: developedAndConnected('Dedicated Motorcycle Parking', 'Beijing') },
    { id: 'crazyRich', group: 'Combinations', name: 'Crazy Rich', description: 'Have Luxury Hotel developed and Singapore connected at any one time.', check: developedAndConnected('Luxury Hotel', 'Singapore') },
    { id: '42wallabyway', group: 'Combinations', name: '42 Wallaby Way', description: 'Have Aquarium developed and Sydney connected at any one time.', check: developedAndConnected('Aquarium', 'Sydney') },
    { id: 'clubObiWan', group: 'Combinations', name: 'Club Obi Wan', description: 'Have Night Lounge developed and Shanghai connected at any one time.', check: developedAndConnected('Night Lounge', 'Shanghai') },

    // Secrets
    { id: 'surprise', group: 'Secrets', name: 'Surprise!', description: 'Claim the surprise in the credits section.' },
]

export const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map(a => a.id))
export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]))
