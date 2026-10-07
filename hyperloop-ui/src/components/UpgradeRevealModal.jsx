import { useEffect } from 'react'
import developmentImages from '../data/developmentImages.js'
import developmentThumbnails from '../data/developmentThumbnails.js'
import { EFFECT_DESCRIPTIONS } from '../utils/effectDescriptions.js'
import developmentRevealThumbnails from '../data/developmentRevealThumbnails.js'
import { cloudinaryResize } from '../utils/cloudinaryImage.js'
import { playClickSound2, playDevelopmentUnlockedSound, playHoverSound } from '../utils/sound.js'
import './UpgradeRevealModal.css'

function UpgradeRevealModal({ upgrade, onContinue }) {
    useEffect(() => {
        playDevelopmentUnlockedSound()
    }, [])

    const effectDesc = EFFECT_DESCRIPTIONS[upgrade.effectType]
        ? EFFECT_DESCRIPTIONS[upgrade.effectType](upgrade.effectValue, upgrade)
        : 'Special effect unlocked'

    return (
        <div className="modal-overlay">
            <div className="upgrade-reveal-modal">
                <p className="upgrade-reveal-heading">You've unlocked a bonus!</p>
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
            </div>
        </div>
    )
}

export default UpgradeRevealModal