// VIP Pods
// Not bought, and not handed out by any city: the Rank 200 milestone gives it (see MILESTONES in App.jsx). It used to be a
// Prestige upgrade. The cost is only what the Development page lists it at; nothing is ever charged for it.
import { Upgrade } from './Upgrade.js'

export const vipPods = new Upgrade(
    "VIP Pods",
    1000000,
    "Service",
    "vipChanceMultiplier",
    10
)
