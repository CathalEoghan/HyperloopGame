// Milestones for how many developments of a category have been built this run. Each one pays Reputation once, the first
// time the count is reached (the claimed ones are remembered per run in hyperloop_dev_milestones, and wiped by a
// prestige like the rest of the run). Everything built from the Development page counts towards its category, whether it is
// a development or an upgrade in the code (the Outdoor Garden is a Recreation upgrade, many Service items are upgrades, and
// Infrastructure and Enterprise are only upgrades). The ones handed over as rank milestones (Founders' Hall, Anniversary
// Sales, ...) count too, so the number always matches the category pill on the Development page.
//
// To change a reward or add a tier, edit the list for its category: `count` is the number of developments built,
// `reputation` the payout (5, 10, 20, 50 and 100 for the first five tiers; Service's and Infrastructure's fourth tier, at 20, is between the 10 and 25 payouts) and `text` the line shown in the popup. Keep the counts rising; Service and
// Infrastructure stop at 20.
export const DEVELOPMENT_MILESTONES = {
    Food: [
        { count: 1, reputation: 5, text: 'The first kitchen is open and the smell is already drifting through the terminal. Hungry passengers finally have somewhere to go.' },
        { count: 5, reputation: 10, text: 'Five places to eat! Word is getting around that this terminal feeds you well.' },
        { count: 10, reputation: 20, text: 'Ten restaurants and counting. Passengers are arriving early just to eat before their loop.' },
        { count: 25, reputation: 50, text: 'Twenty-five food developments! You could eat somewhere new every day for almost a month, and travel writers have started to notice.' },
        { count: 50, reputation: 100, text: 'Fifty! Your terminal is a food destination in its own right, and people book a loop just to eat here!' },
    ],
    Shopping: [
        { count: 1, reputation: 5, text: 'Your first shop has opened its doors. Passengers can finally pick up a souvenir!' },
        { count: 5, reputation: 10, text: 'Five shops make a proper shopping street. Passengers are browsing between loops, and the tills are busy!' },
        { count: 10, reputation: 20, text: 'Ten shops, and the terminal now has a real high street feel. People are leaving with more bags than they arrived with.' },
        { count: 25, reputation: 50, text: 'Twenty-five shops! Passengers are planning their whole shopping trip around your terminal.' },
        { count: 50, reputation: 100, text: 'Fifty shops. The terminal is now globally renowned for its world-class shopping experience.' },
    ],
    Recreation: [
        { count: 1, reputation: 5, text: 'Your first attraction has opened. Passengers now have something to do besides stare at the departure board.' },
        { count: 5, reputation: 10, text: 'Five places to unwind, and waiting for a loop is much less boring. Some passengers are even hoping for a delay!' },
        { count: 10, reputation: 20, text: 'Ten attractions! There is always something going on!' },
        { count: 25, reputation: 50, text: 'Twenty-five attractions. There is more to do here than in most cities - the place is buzzing!' },
        { count: 50, reputation: 100, text: 'Fifty! Your terminal is a destination, not a stopover, and passengers are arriving just to have fun.' },
    ],
    Service: [
        { count: 1, reputation: 5, text: 'Your first service is up and running. Passengers can now rely on the terminal for more than just a loop.' },
        { count: 5, reputation: 10, text: 'Five services in place and the terminal runs more smoothly for it. Tired travellers are getting proper care.' },
        { count: 10, reputation: 20, text: 'Ten services! Passengers describe the terminal as thoughtful, and staff say it is easier to work in too.' },
        { count: 20, reputation: 30, text: 'Twenty services, almost everything a traveller could need. Other terminals are asking how you do it!' },
    ],
    Infrastructure: [
        { count: 1, reputation: 5, text: 'The terminal’s first infrastructure development is finished! Some eagle-eyed passengers have noticed a difference.' },
        { count: 5, reputation: 10, text: 'Five improvements in! The terminal is definitely running a little more smoothly these days, and most passengers are taking notice.' },
        { count: 10, reputation: 20, text: 'Ten infrastructure projects done! The terminal is quietly becoming one of the best-run in the network.' },
        { count: 20, reputation: 30, text: 'Twenty projects. The terminal is a showcase of modern engineering, and visiting delegations are asking for tours.' },
    ],
    Enterprise: [
        { count: 1, reputation: 5, text: 'You’ve launched your first business venture! Your employees are feeling hopeful for the future.' },
        { count: 5, reputation: 10, text: 'Five ventures in, and partners are returning your calls faster than they used to.' },
        { count: 10, reputation: 20, text: 'Ten ventures! The terminal has a real business arm now, and the boardroom has the coffee machine to prove it.' },
        { count: 25, reputation: 50, text: 'Twenty-five ventures. Deals, campaigns and partnerships are everywhere, and rival terminals are taking notes.' },
        { count: 50, reputation: 100, text: 'Fifty! Your terminal is less a station than a business empire, and the whole industry knows its name.' },
    ],
}

// Reputation for connecting a number of cities, and for connecting every city in a continent (Antarctica, the secret
// city, has no continent milestone). Paid once per run, remembered in the same hyperloop_dev_milestones as the categories
// above: the highest city tier under "Cities", and "continent:<name>" = 1 for a finished continent.
export const CITY_MILESTONES = [
    { count: 5, reputation: 10, text: 'Five cities connected! Your loops are starting to feel like a real network.' },
    { count: 15, reputation: 20, text: 'Fifteen cities. Passengers are eagerly planning new journeys.' },
    { count: 30, reputation: 40, text: 'Thirty cities on the network, and the departure board is filling up nicely.' },
    { count: 50, reputation: 50, text: 'Fifty cities! Your network is growing huge.' },
    { count: 100, reputation: 75, text: 'One hundred cities! Your network spans the world!' },
    { count: 250, reputation: 150, text: 'Two hundred and fifty cities. Hardly anywhere is out of reach of a Hyperloop now.' },
]

export const CONTINENT_MILESTONES = {
    Oceania: { reputation: 30, text: 'Every city in Oceania is now on your network! The islands and the coast are all one loop away.' },
    'South America': { reputation: 40, text: 'All of South America is connected! From the mountains to the rainforests, the whole continent is on your network.' },
    Africa: { reputation: 50, text: 'Every city in Africa is connected! A whole continent, from the northern coast to the southern cape, is now just a loop away!' },
    'North America': { reputation: 60, text: 'North America is complete! Coast to coast, every city is connected.' },
    Asia: { reputation: 75, text: 'All of Asia is connected! The biggest continent on Earth is now one network. What a feat!' },
    Europe: { reputation: 100, text: 'Europe is complete! Every city on the continent is connected, and it has never felt so connected.' },
}

// The city tier after the one at `count`, or null when it was the last
export const nextCityMilestone = (count) => CITY_MILESTONES.find(t => t.count > count)?.count ?? null

// How many of a category the player has this run: developments and upgrades alike, rank-milestone ones included
export const builtCount = (category, purchasedDevelopments, purchasedUpgrades) =>
    purchasedDevelopments.filter(d => d.category === category).length
    + purchasedUpgrades.filter(u => u.category === category).length

// The categories in the order their popups are shown if more than one is reached at the same time
export const MILESTONE_CATEGORIES = Object.keys(DEVELOPMENT_MILESTONES)

// The tier whose count is exactly `count`, or null
export const milestoneTier = (category, count) => DEVELOPMENT_MILESTONES[category]?.find(t => t.count === count) || null

// The count of the tier after the one at `count`, or null when it was the last
export const nextMilestoneCount = (category, count) => {
    const next = DEVELOPMENT_MILESTONES[category]?.find(t => t.count > count)
    return next ? next.count : null
}

// The highest tier already paid in each category this run ({ Food: 5, ... }); anything unreadable counts as none
export function readClaimedMilestones() {
    try {
        const saved = JSON.parse(localStorage.getItem('hyperloop_dev_milestones'))
        return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
    } catch {
        return {}
    }
}
