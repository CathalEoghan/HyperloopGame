
import { Upgrade } from '../UpgradeManager/Upgrade.js'

export const waterTaxiTransfers = new Upgrade(
    "Water Taxi Transfers",
    30000,
    "Service",
    "sameContinentBoost", // Cities on same continent = population boost 10%
    0.10
)