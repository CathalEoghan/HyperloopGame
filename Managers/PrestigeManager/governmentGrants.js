// Government Grants: a new run starts at Rank 25 with 24 more cities already unlocked, on top of the starter city.
export const GRANT_RANK = 25
export const GRANT_CITIES = 24

// Gives the grant. The rank comes as bonus XP (RankManager.bonusXp) topping the run up to what Rank 25 needs. It
// used to be done by raising the run's cash earned to that amount instead (about £10.4M), which counted towards the
// Prestige cash points and the "Total cash earned" stat although none of it was ever earned. The balance is untouched
// either way. The cities themselves are only unlocked (progressionManager.unlockCity), the same as a rank-up's
// usual reward - the player still connects each one normally, paying its connection cost and waiting for it to
// build - rather than purchased outright for free: Government Grants' reward is the rank head start and having
// two dozen cities to pick from immediately, not two dozen free connections. Never the Antarctic finale, never a
// city already owned or already unlocked. Call it once the starter city is connected, so that stays the home city.
export function applyGovernmentGrant(progressionManager, rankManager, allCities, { rank = GRANT_RANK, cities = GRANT_CITIES, random = Math.random } = {}) {
    const xpNeeded = rankManager.getCumulativeXP(rank - 1)
    rankManager.bonusXp = Math.max(rankManager.bonusXp, xpNeeded - Math.floor(progressionManager.totalCashEarned))
    rankManager.convertCashToXP(progressionManager.totalCashEarned)
    rankManager.verifyRank()

    // Shuffle (Fisher-Yates), then unlock the first few
    const pool = progressionManager.getUnlockableCities(allCities)
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const granted = pool.slice(0, cities)
    granted.forEach(city => progressionManager.unlockCity(city))
    return { rank: rankManager.rank, cities: granted }
}
