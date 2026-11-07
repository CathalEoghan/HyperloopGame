import { useEffect } from 'react'
import developmentImages from '../data/developmentImages.js'
import developmentThumbnails from '../data/developmentThumbnails.js'
import { EFFECT_DESCRIPTIONS } from '../utils/effectDescriptions.js'
import developmentRevealThumbnails from '../data/developmentRevealThumbnails.js'
import { cloudinaryResize } from '../utils/cloudinaryImage.js'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'
import { playClickSound2, playDevelopmentUnlockedSound, playHoverSound } from '../utils/sound.js'
import './UpgradeRevealModal.css'

// waiting: how many upgrade reveals are queued (this one included). From CONTINUE_ALL_UPGRADES_FROM up, "Continue all"
// dismisses the rest of the queue - the upgrades are already owned by the time this popup shows, so it only skips the
// announcements. Same threshold as the development reveals' "Claim all".
export const CONTINUE_ALL_UPGRADES_FROM = 3

function UpgradeRevealModal({ upgrade, onContinue, waiting = 0, onContinueAll }) {
    // Escape = Continue (this one only, not Continue all)
    useEscapeToClose(() => { playClickSound2(); onContinue() })
    useEffect(() => {
        playDevelopmentUnlockedSound()
    }, [])

    // Early Retirement is bought, not unlocked: its shop text ("Purchasing this upgrade…") would be wrong here (bug #169)
    const isRetirement = upgrade.effectType === 'earlyRetirement'
    const effectDesc = isRetirement
        ? 'You can now retire from the Prestige tab whenever you are ready.'
        : EFFECT_DESCRIPTIONS[upgrade.effectType]
        ? EFFECT_DESCRIPTIONS[upgrade.effectType](upgrade.effectValue, upgrade)
        : 'Special effect unlocked'

    return (
        <div className="modal-overlay">
            <div className="upgrade-reveal-modal">
                <p className="upgrade-reveal-heading">{isRetirement ? 'Early Retirement purchased!' : "You've unlocked a bonus!"}</p>
                <img
                    className="upgrade-reveal-image"
                    src={developmentRevealThumbnails[upgrade.name] || cloudinaryResize(developmentImages[upgrade.name], 600) || developmentThumbnails[upgrade.name]}
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
                {waiting >= CONTINUE_ALL_UPGRADES_FROM && onContinueAll && (
                    <button
                        className="closeButton upgrade-reveal-continueall"
                        onMouseEnter={() => playHoverSound()}
                        onClick={() => { playClickSound2(); onContinueAll() }}
                    >
                        Continue all ({waiting})
                    </button>
                )}
            </div>
        </div>
    )
}

export default UpgradeRevealModal