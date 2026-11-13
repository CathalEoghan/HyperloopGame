// The achievement list. Each one unlocks for good (it survives prestige) and counts towards Anniversary Sales
// (+5% work each) and Trophy Cabinet (+2% income each).
//
// State achievements have a `check(ctx)` that is run every second against a snapshot of the game (see
// AchievementManager.buildContext). Event achievements have no check and are unlocked with `unlock(id)` where it happens.
// `pending` marks one that can't be earned yet because the feature behind it isn't in the game.

import { PrestigeManager } from '../PrestigeManager/PrestigeManager.js'

const atLeast = (key, n) => ctx => ctx[key] >= n
const built = (cat, n) => ctx => (ctx.categories[cat] || 0) >= n
// Cities connected, and developments or upgrades built, at the same time (all of the names given)
const connected = (...names) => ctx => names.every(n => ctx.cityNames.includes(n))
const developed = (...names) => ctx => names.every(n => ctx.builtNames.includes(n))
const developedAndConnected = (dev, city) => ctx => ctx.builtNames.includes(dev) && ctx.cityNames.includes(city)
// A development built with a given city as the home city (the first city of the run - only reachable outside the six starters
// with Personal Favours)
const developedWithHome = (dev, home) => ctx => ctx.homeCity === home && ctx.builtNames.includes(dev)
// One city connected, and one or more developments/upgrades built, together at the same time
const connectedWithDeveloped = (city, ...devs) => ctx => ctx.cityNames.includes(city) && devs.every(n => ctx.builtNames.includes(n))
// A city connected together with owning a Prestige upgrade - Prestige upgrades are permanent once bought
// (they're not in ctx.builtNames, which is only developments and regular upgrades), so this unlocks the
// first time the city is connected on or after buying it.
const connectedWithPrestige = (city, prestigeId) => ctx => ctx.cityNames.includes(city) && PrestigeManager.owns(prestigeId)
// A development/upgrade built together with owning a Prestige upgrade - same reasoning as connectedWithPrestige
const developedWithPrestige = (dev, prestigeId) => ctx => ctx.builtNames.includes(dev) && PrestigeManager.owns(prestigeId)
// A development/upgrade built together with having a general theme purchased from the Shop (owned, not
// necessarily equipped - ctx.ownedThemes is every generalTheme id the player owns, see buildContext)
const developedWithTheme = (dev, themeId) => ctx => ctx.builtNames.includes(dev) && ctx.ownedThemes.includes(themeId)
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
    // No check: an event achievement, unlocked in App.jsx's onDisconnect when the city's country is France
    { id: 'theFrenchDisconnection', group: 'Cities', name: 'The French Disconnection', description: 'Disconnect a French city from your network.' },
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
    { id: 'cameo', group: 'Hyper-Link', name: 'Cameo', description: 'Feeling conceited?' },
    // No check: unlocked in App.jsx's onLikeReward, the same event-achievement pattern as Cameo above
    { id: 'orangeIsTheNewJack', group: 'Hyper-Link', name: 'Orange is the New Jack', description: 'Like a Hyper-Link post from someone called Jack.' },
    // No check: unlocked in App.jsx's onLikeReward on the player's own date, 31 October
    { id: 'tooMuchScreamtime', group: 'Hyper-Link', name: 'Too Much Screamtime', description: 'Like a Hyper-Link post on Halloween (October 31st).' },
    { id: 'shutUp', group: 'Hyper-Link', name: 'Shut Up!', description: 'Mute Hyper-Link.' },

    // Emails
    { id: 'atYourService', group: 'Emails', name: 'At Your Service', description: 'Fulfil an email request.', check: atLeast('emailsFulfilled', 1) },
    { id: 'fiveStars', group: 'Emails', name: 'Five Stars', description: 'Fulfil 10 email requests.', check: atLeast('emailsFulfilled', 10) },
    { id: 'stopAsking', group: 'Emails', name: 'Stop Asking', description: 'Refuse an email request.' },

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
    { id: 'sorry', group: 'Delays', name: 'Sorry!', description: 'Compensate a delayed loop.' },
    { id: 'toughLuck', group: 'Delays', name: 'Tough Luck', description: 'Refuse to compensate a delayed loop.' },

    // Events
    // A lifetime total: the positive-event counter is never reset, not even by a prestige
    { id: 'favoured', group: 'Events', name: 'Favoured', description: 'Experience a lifetime total of 50 positive events.', check: atLeast('positiveEvents', 50) },
    // Needs Crisis Avoidance Specialists switched off if it is owned (Settings, Terminal), since it stops every negative event
    { id: 'cursed', group: 'Events', name: 'Cursed', description: 'Experience a lifetime total of 50 negative events.', check: atLeast('negativeEvents', 50) },

    // Money
    // Earned, not held: every run starts with 1.5 million in the treasury, so a balance target had to be set at 2 million
    // to mean anything. Anyone who already has it keeps it.
    { id: 'firstMillion', group: 'Money', name: 'First Million', description: 'Earn 1 million in a single run.', check: atLeast('runCashEarned', 1e6) },
    { id: 'billionaire', group: 'Money', name: 'Billionaire', description: 'Have a total of 1 billion in your treasury.', check: atLeast('balance', 1e9) },
    { id: 'trillionaire', group: 'Money', name: 'Trillionaire', description: 'Have a total of 1 trillion in your treasury.', check: atLeast('balance', 1e12) },
    { id: 'quadrillionaire', group: 'Money', name: 'Quadrillionaire', description: 'Have a total of 1 quadrillion in your treasury.', check: atLeast('balance', 1e15) },

    // Work
    { id: 'hardWorker', group: 'Work', name: 'Hard Worker', description: 'Press the Work button 100 times.', check: atLeast('work', 100) },
    { id: 'industrious', group: 'Work', name: 'Industrious', description: 'Press the Work button 1000 times.', check: atLeast('work', 1000) },
    { id: 'workaholic', group: 'Work', name: 'Workaholic', description: 'Press the Work button 10,000 times.', check: atLeast('work', 10000) },
    { id: 'yourPoorHand', group: 'Work', name: 'Your Poor Hand', description: 'Click 100,000 times.', check: atLeast('work', 100000) },
    // This run's manual Work clicks (it starts again with every run), so a player who has clicked before can still earn it
    { id: 'couchPotato', group: 'Work', name: 'Couch Potato', description: 'Get to Rank 100 in a run without clicking the Work button.', check: ctx => ctx.rank >= 100 && ctx.runWork === 0 },

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
    { id: 'gardenCandyAnimals', group: 'Combinations', name: 'Garden Candy Animals', description: 'Have Mexico City connected and Outdoor Garden and Candy Store developed at any one time.', check: connectedWithDeveloped('Mexico City', 'Outdoor Garden', 'Candy Store') },
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
    { id: 'hawaiianPizza', group: 'Combinations', name: 'Hawaiian Pizza', description: 'Have Honolulu connected and Pizzeria developed at any one time.', check: developedAndConnected('Pizzeria', 'Honolulu') },
    { id: 'tokyoStool', group: 'Combinations', name: 'Tokyo Stool', description: 'Have Improved Restroom Facilities developed and Tokyo connected at any one time.', check: developedAndConnected('Improved Restroom Facilities', 'Tokyo') },
    { id: 'costaDelNuuk', group: 'Combinations', name: 'Costa del Nuuk', description: 'With Nuuk as your home city, develop Beach-Themed Bar.', check: developedWithHome('Beach-Themed Bar', 'Nuuk') },
    { id: 'czechMate', group: 'Combinations', name: 'Czech Mate', description: 'With Prague as your home city, develop Chess Club.', check: developedWithHome('Chess Club', 'Prague') },
    { id: 'nomNomNomsk', group: 'Combinations', name: 'Nom Nom Nomsk', description: 'With Omsk as your home city, fully upgrade a Food development to Level 10.', check: ctx => ctx.homeCity === 'Omsk' && ctx.maxedFood },
    { id: 'coolForCuts', group: 'Combinations', name: 'Cool for Cuts', description: 'Have Barber Shop or Hair Salon developed and the Kitty general theme purchased at any one time.', check: ctx => ctx.ownedThemes.includes('kitty') && (ctx.builtNames.includes('Barber Shop') || ctx.builtNames.includes('Hair Salon')) },
    { id: '343GuiltyBark', group: 'Combinations', name: '343 Guilty Bark', description: 'Have Gaming Arcade developed and the Woof general theme purchased at any one time.', check: developedWithTheme('Gaming Arcade', 'woof') },
    // No check: event achievements, unlocked in App.jsx the moment a build starts (see startedBuildAchievements below)
    { id: 'priorities', group: 'Combinations', name: 'Priorities', description: 'Build a Dance Studio while a Security Incident is active.' },
    { id: 'makesSense', group: 'Combinations', name: 'Makes Sense', description: 'Build a Health Clinic while a Sickness Outbreak event is active.' },
    { id: 'biggerBoat', group: 'Combinations', name: 'Gonna Need a Bigger Boat', description: 'Develop Water Taxi Transfers or Ferry Terminal while a Record Passenger Day event is active.' },
    { id: 'poolsClosed', group: 'Combinations', name: 'Pool\'s Closed', description: 'Develop Swimming Pool while a Severe Weather event is active.' },
    { id: 'hungerGames', group: 'Combinations', name: 'Hunger Games', description: 'With no Food developments constructed, build a Gaming Arcade.' },
    // Everything built (ctx.builds, which leaves out what the rank milestones hand over) is the Outdoor Garden or an Enterprise
    // development, and there are at least 10 of those
    { id: 'lotusOperandi', group: 'Combinations', name: 'Lotus Operandi', description: 'Have an Outdoor Garden developed and 10 Enterprise-category developments launched, with no other developments constructed.', check: ctx => ctx.builtNames.includes('Outdoor Garden') && (ctx.categories.Enterprise || 0) >= 10 && ctx.builds === 1 + (ctx.categories.Enterprise || 0) },
    // Advanced Engineering is a Prestige upgrade, not a development - it's permanent once bought, so this
    // unlocks the first time Gothenburg is connected on or after buying it (see connectedWithPrestige above).
    { id: 'maceToTheFace', group: 'Combinations', name: 'Mace to the Face', description: 'Have Gothenburg connected and the Advanced Engineering Prestige upgrade unlocked at any one time.', check: connectedWithPrestige('Gothenburg', 'advancedEngineering') },
    { id: 'iWannaBeARockstar', group: 'Combinations', name: 'I Wanna Be a Rockstar', description: 'Have Rock Bar developed and the Rockstar general theme purchased at any one time.', check: developedWithTheme('Rock Bar', 'rockstar') },
    { id: 'costumeParty', group: 'Combinations', name: 'Costume Party', description: 'Have both Costume Store and Halloween Fair developed at any one time.', check: developed('Costume Store', 'Halloween Fair') },
    { id: 'familyGuy', group: 'Combinations', name: 'Family Guy', description: 'Have both Expanded Family Rooms developed and the Playroom general theme purchased at any one time.', check: developedWithTheme('Expanded Family Rooms', 'playroom') },
    { id: 'vanityFare', group: 'Combinations', name: 'Vanity Fare', description: 'Have both Personal Styling Retinue launched and the Global Ticket Cuts prestige upgrade unlocked at any one time.', check: developedWithPrestige('Personal Styling Retinue', 'globalTicketCuts') },
    { id: 'newHeights', group: 'Combinations', name: 'New Heights', description: 'Have both Observation Deck developed and Kathmandu connected at any one time.', check: developedAndConnected('Observation Deck', 'Kathmandu') },
    { id: 'moreThanACeiling', group: 'Combinations', name: 'More Than a Ceiling', description: 'Have both Palatial Interior Renovations developed and Boston connected at any one time.', check: developedAndConnected('Palatial Interior Renovations', 'Boston') },
    { id: 'betterCallFall', group: 'Combinations', name: 'Better Call Fall!', description: 'Have both Autumn Getaway Packages and Customer Service Centre developed at any one time.', check: developed('Autumn Getaway Packages', 'Customer Service Centre') },
    // No check: an event achievement, unlocked in App.jsx's onRemove at the moment Petting Zoo is removed -
    // a plain state check can't tell "removed" from "never built" once the development is gone.
    { id: 'sinceTheDucksLeft', group: 'Combinations', name: 'Since the Ducks Left', description: 'With New York as your home city, remove the Petting Zoo development while having the Duck theme purchased.' },

    // Prestige
    { id: 'groundhogDay', group: 'Prestige', name: 'Groundhog Day', description: 'Retire 5 times.', check: atLeast('retirements', 5) },

    // Secrets
    { id: 'surprise', group: 'Secrets', name: 'Surprise!', description: 'Claim the surprise in the credits section.' },
]

export const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map(a => a.id))
export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]))

// The event achievements a build earns the moment it starts. `activeEventId` is the id of the event running right now (or
// null); `foodBuilt` is how many Food developments are built or under construction (the one starting is not counted).
// Builds that earn an achievement only while a particular event is running: the development (any of the names given), the id of the
// event, and the achievement. Which event is running is checked when the build starts.
const BUILD_DURING_EVENT = [
    { names: ['Dance Studio'], event: 'security_incident', id: 'priorities' },
    { names: ['Health Clinic'], event: 'sickness_outbreak', id: 'makesSense' },
    { names: ['Water Taxi Transfers', 'Ferry Terminal'], event: 'record_day', id: 'biggerBoat' },
    { names: ['Swimming Pool'], event: 'bad_weather', id: 'poolsClosed' },
]

export function startedBuildAchievements(development, { activeEventId = null, foodBuilt = 0 } = {}) {
    const ids = []
    BUILD_DURING_EVENT.forEach(r => { if (activeEventId === r.event && r.names.includes(development?.name)) ids.push(r.id) })
    if (development?.name === 'Gaming Arcade' && foodBuilt === 0) ids.push('hungerGames')
    return ids
}
