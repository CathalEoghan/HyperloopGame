import { useEffect, useRef, useState } from 'react'
import { playClickSound2, playHoverSound, playDailyLoginSound, playNotEnoughFundsSound } from '../utils/sound.js'
import reputationIcon from '../assets/misc/reputation.png'
import cashIcon from '../assets/misc/cash.png'
import AbbreviatedNumber from './AbbreviatedNumber.jsx'
import './DailyLoginModal.css'

// repSources: the names of the owned upgrades that pay the daily Reputation (bug #154)
function DailyLoginModal({ cashBonus, repBonus, onCollect, reputation, onSpendRep, repSources = [], interestBoosted = false }) {
    const [doubled, setDoubled] = useState(false)
    const [doubleHovered, setDoubleHovered] = useState(false)
    const canDouble = reputation >= 20 && !doubled
    const displayBonus = doubled ? cashBonus * 2 : cashBonus

    useEffect(() => {
        playDailyLoginSound()
    }, [])

    // Enter collects, unless a button has focus (then Enter already does that button's own job)
    const collectRef = useRef(null)
    useEffect(() => { collectRef.current = () => { playClickSound2(); onCollect(displayBonus) } })
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Enter' && !(e.target instanceof HTMLElement && e.target.closest('button'))) collectRef.current() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    // What the headline figure is made of, so the multipliers read as a breakdown rather than as part of the number
    const multipliers = [interestBoosted && '10 Better Interest Rates', doubled && '2 Double bonus'].filter(Boolean)

    return (
        <div className="modal-overlay">
            <div className="daily-login-modal">
                <p className="daily-login-heading">DAILY BONUS</p>
                <h2 className="daily-login-title">Hello!</h2>
                <p className="daily-login-subtitle">Your daily reward is ready.</p>
                <div className="daily-login-rewards">
                    <div className="daily-login-reward-row">
                        <img src={cashIcon} alt="cash" className="daily-login-icon" />
                        <span className="daily-login-reward-text">
                            <AbbreviatedNumber value={displayBonus} />
                        </span>
                    </div>
                    {multipliers.length > 0 && (
                        <p className="daily-login-breakdown">
                            <AbbreviatedNumber value={cashBonus / (interestBoosted ? 10 : 1)} />
                            {multipliers.map(m => <span key={m}> × {m}</span>)}
                        </p>
                    )}
                    {repBonus > 0 && (
                        <div className="daily-login-reward-row">
                            <img src={reputationIcon} alt="reputation" className="daily-login-icon" />
                            <span className="daily-login-reward-text">+{repBonus} Reputation</span>
                        </div>
                    )}
                </div>
                {repBonus > 0 && (
                    <p className="daily-login-note">{repSources.length > 0 ? `Reputation bonus from ${repSources.join(' and ')}` : 'Daily Reputation bonus'}</p>
                )}
                {!doubled && (
                    <button
                        style={{
                            marginTop: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                            background: doubleHovered && canDouble ? 'var(--ui-accent, #f5a623)' : 'white',
                            color: doubleHovered && canDouble ? 'white' : canDouble ? 'black' : '#aaa',
                            border: `2px solid ${canDouble ? 'black' : '#ccc'}`,
                            borderRadius: '8px', padding: '8px 16px',
                            cursor: canDouble ? 'var(--cursor-pointer, pointer)' : 'not-allowed',
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
                        {/* The trophy icon is flush to its own canvas, so it sits a couple of px lower to look level with the text */}
                        {canDouble ? (
                            <span>Double it for <img src={reputationIcon} alt="Reputation" style={{ width: '14px', height: '14px', border: 'none', verticalAlign: 'middle', position: 'relative', top: '-1px', margin: '0 3px' }} />20 (<AbbreviatedNumber value={cashBonus * 2} />)</span>
                        ) : (
                            <span>Double it: needs <img src={reputationIcon} alt="Reputation" style={{ width: '14px', height: '14px', border: 'none', verticalAlign: 'middle', position: 'relative', top: '-1px', margin: '0 3px' }} />20 (you have {reputation})</span>
                        )}
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
                <p className="daily-login-next">Next daily bonus: tomorrow</p>
            </div>
        </div>
    )
}

export default DailyLoginModal