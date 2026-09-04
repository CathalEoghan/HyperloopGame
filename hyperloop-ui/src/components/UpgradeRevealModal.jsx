import { useEffect } from 'react'
import developmentImages from '../data/developmentImages.js'
import { playClickSound2, playDevelopmentUnlockedSound, playHoverSound } from '../utils/sound.js'
import './UpgradeRevealModal.css'

const EFFECT_DESCRIPTIONS = {
    foodIncome: (v) => `+${Math.round(v * 100)}% income from all Food developments`,
    recreationIncome: (v) => `+${Math.round(v * 100)}% income from all Recreation developments`,
    shoppingIncome: (v) => `+${Math.round(v * 100)}% income from all Shopping developments`,
    serviceIncome: (v) => `+${Math.round(v * 100)}% income from all Service developments`,
    developmentBoost: (v) => `+${Math.round(v * 100)}% income from all developments`,
    connectionBoost: (v) => `+${Math.round(v * 100)}% income from all city connections`,
    workClickBonus: () => `+£100 per Work click`,
    offlineCapExtension: () => `+24 hours offline earnings cap`,
    developmentDiscount: (v) => `-${Math.round(v * 100)}% development construction cost`,
    delayCompensationReduction: (v) => `-${Math.round(v * 100)}% delay compensation cost`,
    delayRepCostReduction: (v) => `-${v} Reputation when ignoring delays`,
    bonusDurationExtension: (v) => `Bonus events last ${Math.round(v * 100)}% longer`,
    farewellWindowExtension: (v) => `+${v} minutes farewell window`,
    farewellRepDoubled: () => `Reputation from farewells doubled`,
    negativeEventReduction: (v) => `Negative events ${Math.round(v * 100)}% less likely`,
    workRepChanceDouble: () => `Double chance of earning Reputation from Work`,
    workRepChanceTriple: () => `Triple chance of earning Reputation from Work`,
    continentExpansionBoost: (v) => `+${Math.round(v * 100)}% earnings per unique continent expanded to`,
    countryExpansionBoost: (v) => `+${v * 100}% earnings per unique country expanded to`,
    southernHemisphereBoost: (v) => `+${Math.round(v * 100)}% income from southern hemisphere cities`,
    arcticBoost: (v) => `+${Math.round(v * 100)}% income from Arctic cities`,
    continentBoost: (v) => `+${Math.round(v * 100)}% income from cities on this continent`,
    countryAdvertisingBoost: (v) => `+${Math.round(v * 100)}% income from cities in this country`,
    localCountryBoost: () => `Bonus income from cities in your home country`,
    seasonBoost: (v) => `+${Math.round(v * 100)}% income during this season`,
    rerollRepDiscount: (v) => `-${v} Reputation cost to re-roll city unlocks`,
    firstFarewellOfDayDouble: () => `First farewell of the day earns double Reputation`,
    freeRerollOnRankUp: () => `One free city re-roll each time you rank up`,
    positiveEventBoost: (v) => `+${Math.round(v * 100)}% chance of positive events`,
}

function UpgradeRevealModal({ upgrade, onContinue }) {
    useEffect(() => {
        playDevelopmentUnlockedSound()
    }, [])

    const effectDesc = EFFECT_DESCRIPTIONS[upgrade.effectType]
        ? EFFECT_DESCRIPTIONS[upgrade.effectType](upgrade.effectValue)
        : 'Special effect unlocked'

    return (
        <div className="modal-overlay">
            <div className="upgrade-reveal-modal">
                <p className="upgrade-reveal-heading">You've unlocked a bonus!</p>
                <img
                    className="upgrade-reveal-image"
                    src={developmentImages[upgrade.name]}
                    alt={upgrade.name}
                />
                <p className="upgrade-reveal-category">{upgrade.category}</p>
                <h3 className="upgrade-reveal-name">{upgrade.name}</h3>
                <div className="upgrade-reveal-effect">
                    <span className="upgrade-reveal-effect-text">✦ {effectDesc}</span>
                </div>
                <button
                    className="closeButton"
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => { playClickSound2(); onContinue() }}
                >
                    Continue
                </button>
            </div>
        </div>
    )
}

export default UpgradeRevealModal