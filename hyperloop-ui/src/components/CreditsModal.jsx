import { useState } from 'react'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'
import { playClickSound2, playHoverSound } from '../utils/sound.js'
import officialLogo from '../assets/misc/officialLogo.png'
import mePhoto from '../assets/misc/me.jpg'
import { WIKIMEDIA_CREDITS, FREESOUND_CC_CREDITS, FLATICON_AUTHORS } from '../data/creditsData.js'
import './CreditsModal.css'

const BONUS_KEY = 'hyperloop_dev_portrait_bonus'

// A clickable attribution line when a source URL is known, otherwise plain text - either way it reads as
// "name — author · licence". Wikimedia entries without a surviving link (the uploader removed the page, or
// never gave a link) still get credited by name, just without anywhere to click through to.
function CreditLine({ name, author, license, url }) {
    const text = `${name} — ${author} · ${license}`
    return (
        <p className="credits-line">
            {url
                ? <a className="credits-link" href={url} target="_blank" rel="noopener noreferrer">{text}</a>
                : text}
        </p>
    )
}

function CreditsModal({ onClose, onReputationBonus, onSurprise }) {
    useEscapeToClose(() => { playClickSound2(); onClose() })
    const [claimed, setClaimed] = useState(() => !!localStorage.getItem(BONUS_KEY))
    const [showToast, setShowToast] = useState(false)

    const handlePortraitClick = () => {
        // Already claimed (maybe before achievements existed): the click still counts for the achievement
        if (claimed) { onSurprise?.(); return }
        playClickSound2()
        localStorage.setItem(BONUS_KEY, '1')
        setClaimed(true)
        setShowToast(true)
        onReputationBonus?.(50)
        onSurprise?.()
        setTimeout(() => setShowToast(false), 3000)
    }

    const flaticonLine = FLATICON_AUTHORS.join(', ')

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="credits-modal" onClick={e => e.stopPropagation()}>
                <p className="credits-heading"><img src={officialLogo} alt="Hyperloop Empire" className="credits-heading-logo" /> CREDITS</p>
                <div className="credits-body">
                    <p className="credits-section">Game Design &amp; Development</p>
                    <p className="credits-line">Cathal Eoghan, the sole developer</p>
                    <p className="credits-line">Built with React, Three.js and a lot of Monster energy drinks.</p>

                    <p className="credits-section">City &amp; Development Photography</p>
                    <p className="credits-line">Most city and development photos are sourced from Pexels, which doesn't require attribution - but thank you to every photographer whose work appears here regardless.</p>
                    <p className="credits-subheading">Individually licensed (Wikimedia Commons)</p>
                    {WIKIMEDIA_CREDITS.map((c, i) => <CreditLine key={i} {...c} />)}

                    <p className="credits-section">Theme, Profile &amp; Prestige Artwork</p>
                    <p className="credits-line">Shop theme photos, Hyper-Link profile pictures and Prestige upgrade artwork are sourced from Pexels and Pixabay.</p>

                    <p className="credits-section">Achievement &amp; UI Icons</p>
                    <p className="credits-line">Icons by {flaticonLine}, from <a className="credits-link" href="https://www.flaticon.com" target="_blank" rel="noopener noreferrer">Flaticon</a>.</p>

                    <p className="credits-section">Sounds &amp; Music</p>
                    <p className="credits-line">Most sound effects and opening audios are sourced from Pixabay, which doesn't require attribution.</p>
                    <p className="credits-subheading">Individually licensed (Freesound, Creative Commons)</p>
                    {FREESOUND_CC_CREDITS.map((c, i) => (
                        <div key={i}>
                            <CreditLine {...c} />
                            {!c.commercial && <p className="credits-note">Pending permission for commercial use - see Settings &gt; Legal &amp; Privacy.</p>}
                        </div>
                    ))}

                    <p className="credits-section">Globe Imagery</p>
                    <p className="credits-line">NASA Visible Earth (public domain)</p>

                    <p className="credits-section">Fonts &amp; Open Source</p>
                    <p className="credits-line">Inter typeface - SIL Open Font License 1.1</p>
                    <p className="credits-line">Country flags - the flag-icons project (MIT licence)</p>

                    <p className="credits-section">Full Attribution</p>
                    <p className="credits-line">Every individual Pexels and Pixabay photo credit - not legally required, but given anyway - is listed file-by-file in CREDITS.txt at github.com/CathalEoghan/HyperloopGame</p>
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
                            border: '3px solid var(--ui-accent, #f5a623)',
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
