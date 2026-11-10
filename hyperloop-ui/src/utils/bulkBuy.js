// Plans a "buy everything affordable" pass for a Connect-all / Develop-all button: pure and side-effect-free, so
// the exact same numbers it returns can be shown on the button before it's pressed, then spent for real by
// buying `toBuy` in the order given. Cheapest first, so the most items fit in the budget; a purchase is only
// ever skipped for being unaffordable, never because an earlier one happened to come first in the list.
//
// costOf(item, state) returns this item's price right now, as { cash, rep } (rep defaults to 0). onBought(state,
// item), if given, returns the state after buying it. Nothing passes one today: Bank (-15% development cost) used
// to, but a Bank bought in a batch only takes effect once its own construction finishes, so the rest of that batch
// is really charged full price (see DevelopmentPage's Develop all).
export function planBulkBuy(items, costOf, startState, onBought) {
    const order = [...items].sort((a, b) => {
        const ca = costOf(a, startState), cb = costOf(b, startState)
        return (ca.cash + (ca.rep || 0) * 1000) - (cb.cash + (cb.rep || 0) * 1000)
    })
    let cash = startState.cash, rep = startState.rep || 0, state = startState
    const toBuy = []
    let totalCash = 0, totalRep = 0
    for (const item of order) {
        const cost = costOf(item, state)
        const rCost = cost.rep || 0
        if (cash < cost.cash || rep < rCost) continue
        cash -= cost.cash; rep -= rCost
        totalCash += cost.cash; totalRep += rCost
        toBuy.push(item)
        if (onBought) state = onBought(state, item)
    }
    return { toBuy, totalCash, totalRep }
}
