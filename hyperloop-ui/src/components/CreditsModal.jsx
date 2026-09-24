import { useState } from 'react'
import { playClickSound2, playHoverSound } from '../utils/sound.js'
import globeIcon from '/public/globeIcon.png'
import mePhoto from '../assets/misc/me.jpg'
import './CreditsModal.css'

const CREDITS_TEXT = `CITY IMAGES
All city photographs sourced via Pexels and Wikimedia Commons.
Full attribution available at github.com/CathalEoghan/HyperloopGame
DEVELOPMENT IMAGES
All development photographs sourced via Pexels and Wikimedia Commons.
Full attribution available at github.com/CathalEoghan/HyperloopGame
SOUNDS
cityConnectComplete.mp3 — Robinhood76 via Freesound
leavingSound.mp3 — GraceSoundProductions via Pixabay
farewellAccept.mp3 — Universfield via Pixabay
constructionSound.mp3 — freesound community via Pixabay
workClickSound.mp3 — linhmitto via Pixabay
openingAudio.mp3 — via Pixabay
hoverSound.mp3 — tunetank via Pixabay
developmentUnlocked.mp3 — freesound via Pixabay
REPUTATION ICON
Clean icons created by Smashicons — Flaticon
GLOBE TEXTURES
NASA Visible Earth
GAME DESIGN & DEVELOPMENT
Cathal Eoghan, the sole developer
Built with React, Three.js and a lot of Monster energy drinks.`

const BONUS_KEY = 'hyperloop_dev_portrait_bonus'

function CreditsModal({ onClose, onReputationBonus }) {
    const [claimed, setClaimed] = useState(() => !!localStorage.getItem(BONUS_KEY))
    const [showToast, setShowToast] = useState(false)

    const handlePortraitClick = () => {
        if (claimed) return
        playClickSound2()
        localStorage.setItem(BONUS_KEY, '1')
        setClaimed(true)
        setShowToast(true)
        onReputationBonus?.(50)
        setTimeout(() => setShowToast(false), 3000)
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="credits-modal" onClick={e => e.stopPropagation()}>
                <p className="credits-heading"><img src={globeIcon} alt="globe" className="brand-icon" /> CREDITS</p>
                <div className="credits-body">
                    {CREDITS_TEXT.split('\n').map((line, i) => (
                        <p key={i} className={line === line.toUpperCase() && line.trim() ? 'credits-section' : 'credits-line'}>
                            {line || '\u00A0'}
                        </p>
                    ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0 12px' }}>
                    <img
                        src={mePhoto}
                        alt="Cathal Eoghan"
                        className={claimed ? 'dev-portrait-claimed' : 'dev-portrait-clickable'}
                        onClick={handlePortraitClick}
                        onMouseEnter={() => { if (!claimed) playHoverSound() }}
                        style={{
                            width: '140px',
                            height: '140px',
                            objectFit: 'cover',
                            border: '3px solid #f5a623',
                            borderRadius: '4px',
                            marginBottom: '10px',
                        }}
                    />
                    <p style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#111', margin: '0 0 4px' }}>Cathal Eoghan</p>
                    <p style={{ fontStyle: 'italic', color: '#888', fontSize: '0.85rem', margin: 0 }}>Thanks for playing!</p>
                    {showToast && <p className="dev-bonus-toast">✨ +50 REPUTATION</p>}
                </div>
                <button className="closeButton" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onClose() }}>Close</button>
            </div>
        </div>
    )
}

export default CreditsModal