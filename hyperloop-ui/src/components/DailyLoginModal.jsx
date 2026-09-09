import { useEffect, useState } from 'react'
import { playClickSound2, playHoverSound, playDailyLoginSound, playNotEnoughFundsSound } from '../utils/sound.js'
import reputationIcon from '../assets/misc/reputation.png'
import cashIcon from '../assets/misc/cash.png'
import globeIcon from '/public/globeIcon.png'
import './DailyLoginModal.css'

function DailyLoginModal({ cashBonus, repBonus, onCollect, reputation, onSpendRep }) {
    const [doubled, setDoubled] = useState(false)
    const [doubleHovered, setDoubleHovered] = useState(false)
    const canDouble = reputation >= 20 && !doubled
    const displayBonus = doubled ? cashBonus * 2 : cashBonus

    useEffect(() => {
        playDailyLoginSound()
    }, [])

    return (
        <div className="modal-overlay">
            <div className="daily-login-modal">
                <p className="daily-login-heading"><img src={globeIcon} alt="globe" className="brand-icon" /> DAILY BONUS</p>
                <h2 className="daily-login-title">Welcome back!</h2>
                <p className="daily-login-subtitle">Your terminal has been busy while you were away. Here's your daily reward:</p>
                <div className="daily-login-rewards">
                    <div className="daily-login-reward-row">
                        <img src={cashIcon} alt="cash" className="daily-login-icon" />
                        <span className="daily-login-reward-text">
                            £{displayBonus.toLocaleString()}
                            {doubled && <span style={{ color: '#f5a623', fontSize: '0.8rem', fontWeight: 'bold', marginLeft: '6px' }}>×2</span>}
                        </span>
                    </div>
                    {repBonus > 0 && (
                        <div className="daily-login-reward-row">
                            <img src={reputationIcon} alt="reputation" className="daily-login-icon" />
                            <span className="daily-login-reward-text">+{repBonus} Reputation</span>
                        </div>
                    )}
                </div>
                {repBonus > 0 && (
                    <p className="daily-login-note">Reputation bonus from Passenger Loyalty Scheme</p>
                )}
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
                            margin: '12px auto 0',
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
                        Double bonus (20
                        <img src={reputationIcon} alt="rep" style={{ width: '14px', height: '14px', border: 'none', verticalAlign: 'middle' }} />
                        )
                    </button>
                )}
                <button
                    className="opening-btn"
                    style={{ border: '2px solid white', marginTop: '12px' }}
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => { playClickSound2(); onCollect(displayBonus) }}
                >
                    Collect
                </button>
            </div>
        </div>
    )
}

export default DailyLoginModal