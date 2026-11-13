// Prestige perks the player can switch off in Settings (Terminal), for the achievements a perk makes impossible to earn:
// Crisis Avoidance Specialists stops every negative event (so "Cursed" can never be earned), and Government Grants starts
// a run at Rank 25. The perk stays owned either way; a switched-off one simply does nothing until it is switched back on.
import { PrestigeManager } from './PrestigeManager.js'

export const PERK_TOGGLE_KEYS = {
    crisisAvoidanceSpecialists: 'hyperloop_perk_crisis_avoidance',
    governmentGrants: 'hyperloop_perk_government_grants',
}

// On unless the player turned it off
export function perkSwitchedOn(id) {
    try { return localStorage.getItem(PERK_TOGGLE_KEYS[id]) !== 'false' } catch { return true }
}

// Owned and switched on: the one question the game asks before applying one of these perks
export function perkActive(id) {
    return PrestigeManager.owns(id) && perkSwitchedOn(id)
}
