// The "Auto-claim rank-ups" setting: with it on, every rank-up waiting is claimed at once with random cities (the same as
// the Claim all button) the moment nothing else is on screen, so a fast climb is one summary popup instead of a rank-up,
// a city offer and a reveal for every single rank. Off by default: it gives up choosing, re-rolling and Lobbying Suavity.
export const AUTO_CLAIM_RANKUPS_KEY = 'hyperloop_auto_claim_rankups'

export function autoClaimRankUpsEnabled() {
    try { return localStorage.getItem(AUTO_CLAIM_RANKUPS_KEY) === 'true' } catch { return false }
}
