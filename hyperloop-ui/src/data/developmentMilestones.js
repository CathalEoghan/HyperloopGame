// Milestones for how many developments of a category have been built this run. Each one pays Reputation once, the first
// time the count is reached (the claimed ones are remembered per run in hyperloop_dev_milestones, and wiped by a
// prestige like the rest of the run). Only the four categories of development are counted: Infrastructure and Enterprise
// are made of upgrades, not developments.
//
// To change a reward or add a tier, edit the list for its category: `count` is the number of developments built,
// `reputation` the payout (5, 10, 20, 50 and 100 for the first five tiers; Service's fourth tier, at 20, is between the 10 and 25 payouts) and `text` the line shown in the popup. Keep the counts rising; Service has fewer
// developments than the other three, so it stops earlier.
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
}

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
