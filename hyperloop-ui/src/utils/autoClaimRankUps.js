// The "Auto-claim rank-ups" setting: with it on, every rank-up waiting is claimed at once with random cities (the same as
// the Claim all button) the moment nothing else is on screen, and silently - no rank-up popup, offer, reveal or summary -
// so a fast climb costs no clicks at all. Off by default: it gives up choosing, re-rolling and Lobbying Suavity.
export const AUTO_CLAIM_RANKUPS_KEY = 'hyperloop_auto_claim_rankups'

export function autoClaimRankUpsEnabled() {
    try { return localStorage.getItem(AUTO_CLAIM_RANKUPS_KEY) === 'true' } catch { return false }
}
