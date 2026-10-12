import { useEffect } from 'react'
import developmentImages from '../data/developmentImages.js'
import { playClickSound2, playDevelopmentUnlockedSound, playHoverSound } from '../utils/sound.js'
import developmentThumbnails from '../data/developmentThumbnails.js'
import developmentRevealThumbnails from '../data/developmentRevealThumbnails.js'
import { cloudinaryResize } from '../utils/cloudinaryImage.js'
import './DevelopmentRevealModal.css'

// waiting: how many reveals are queued (this one included). From CLAIM_ALL_FROM up, "Claim all" skips the rest of the queue.
export const CLAIM_ALL_DEVS_FROM = 3

function DevelopmentRevealModal({ development, onContinue, waiting = 0, onClaimAll }) {
    useEffect(() => {
        playDevelopmentUnlockedSound()
    }, [])

    return (
        <div className="modal-overlay">
            <div className="dev-reveal-modal">
                <p className="dev-reveal-heading">New development unlocked!</p>
                <img
                    className="dev-reveal-image"
                    src={developmentRevealThumbnails[development.name] || cloudinaryResize(developmentImages[development.name], 600) || developmentThumbnails[development.name]}
                    alt={development.name}
                />
                <p className="dev-reveal-category">{development.category}</p>
                <h3 className="dev-reveal-name">{development.name}</h3>
                <button
                    className="closeButton"
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => { playClickSound2(); onContinue() }}
                >
                    Continue
                </button>
                {waiting >= CLAIM_ALL_DEVS_FROM && onClaimAll && (
                    <button
                        className="closeButton dev-reveal-claimall"
                        onMouseEnter={() => playHoverSound()}
                        onClick={() => { playClickSound2(); onClaimAll() }}
                    >
                        Claim all developments ({waiting})
                    </button>
                )}
            </div>
        </div>
    )
}

export default DevelopmentRevealModal