import { useState } from 'react'
import helloIcon from '../assets/misc/hello.png'
import cashIcon from '../assets/misc/cash.png'
import reputationIcon from '../assets/misc/reputation.png'
import { playClickSound2, playHoverSound, playNotEnoughFundsSound } from '../utils/sound.js'
import './OfflineModal.css'

function formatDuration(seconds) {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m} minutes`
    return 'a moment'
}

function OfflineModal({ offlineSeconds, offlineIncome, onCollect, reputation, onSpendRep }) {
    const [doubled, setDoubled] = useState(false)
    const [doubleHovered, setDoubleHovered] = useState(false)
    const canDouble = reputation >= 20 && !doubled
    const displayIncome = doubled ? Math.floor(offlineIncome * 2) : Math.floor(offlineIncome)

    return (
        <div className="modal-overlay">
            <div className="modal offline-modal">
                <img src={helloIcon} alt="hello" className="offline-icon" style={{ width: '64px', height: '64px', objectFit: 'contain', border: 'none', borderRadius: '0' }} />
                <h2 className="offline-title">Welcome back!</h2>
                <p className="offline-subtitle">
                    You were away for <strong>{formatDuration(offlineSeconds)}</strong>
                </p>
                <div className="offline-earnings-box">
                    <span className="offline-earnings-label">Offline earnings</span>
                    <span className="offline-earnings-amount" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <img src={cashIcon} alt="£" className="cash-icon" style={{ width: '22px', height: '22px', border: 'none', borderRadius: '0', objectFit: 'contain', marginTop: '3px' }} />
                        {displayIncome.toLocaleString()}
                        {doubled && <span style={{ color: '#f5a623', fontSize: '0.8rem', fontWeight: 'bold' }}>×2</span>}
                    </span>
                    <span className="offline-earnings-note">Capped at 48 hours</span>
                </div>
                {!doubled && (
                    <button
                        style={{
                            marginTop: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                            background: doubleHovered && canDouble ? '#f5a623' : 'white',
                            color: doubleHovered && canDouble ? 'white' : canDouble ? 'black' : '#aaa',
                            border: `2px solid ${canDouble ? 'black' : '#ccc'}`,
                            borderRadius: '8px', padding: '8px 16px',
                            cursor: canDouble ? 'pointer' : 'not-allowed',
                            fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '0.85rem',
                            opacity: canDouble ? 1 : 0.5,
                            transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={() => { setDoubleHovered(true); if (canDouble) playHoverSound() }}
                        onMouseLeave={() => setDoubleHovered(false)}
                        onClick={() => {
    if (!canDouble) { playNotEnoughFundsSound(); return }
    playClickSound2()
    onSpendRep(20)
    setDoubled(true)
}}
                    >
                        Double earnings (20
                        <img src={reputationIcon} alt="rep" style={{ width: '14px', height: '14px', border: 'none', verticalAlign: 'middle' }} />
                        )
                    </button>
                )}
                <button
                    className="closeButton"
                    style={{ marginTop: '12px' }}
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => { playClickSound2(); onCollect(displayIncome) }}
                >
                    Collect & Continue
                </button>
            </div>
        </div>
    )
}

export default OfflineModal