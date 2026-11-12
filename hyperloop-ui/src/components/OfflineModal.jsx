import { useEffect, useRef, useState } from 'react'
import helloIcon from '../assets/misc/hello.png'
import cashIcon from '../assets/misc/cash.png'
import reputationIcon from '../assets/misc/reputation.png'
import { playClickSound2, playHoverSound, playNotEnoughFundsSound } from '../utils/sound.js'
import AbbreviatedNumber from './AbbreviatedNumber.jsx'
import './OfflineModal.css'

function formatDuration(seconds) {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m} ${m === 1 ? 'minute' : 'minutes'}`
    return 'a moment'
}

function OfflineModal({ offlineSeconds, offlineIncome, onCollect, reputation, onSpendRep, capHours = 48, bonusFactor = 2 }) {
    const [doubled, setDoubled] = useState(false)
    const [doubleHovered, setDoubleHovered] = useState(false)
    const canDouble = reputation >= 20 && !doubled
    const displayIncome = doubled ? Math.floor(offlineIncome * bonusFactor) : Math.floor(offlineIncome)
    const bonusWord = bonusFactor >= 4 ? 'Quadruple' : bonusFactor >= 3 ? 'Triple' : 'Double'

    // Enter collects, unless a button has focus (then Enter already does that button's own job)
    const collectRef = useRef(null)
    useEffect(() => { collectRef.current = () => { playClickSound2(); onCollect(displayIncome) } })
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Enter' && !(e.target instanceof HTMLElement && e.target.closest('button'))) collectRef.current() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    // The payout is stepped through the absence hour by hour (it varies with the time of day, the timetable and so
    // on), so what can honestly be shown is the average it came to over the time that counted: the whole absence, or
    // the cap if it was longer
    const countedSeconds = Math.min(offlineSeconds, Number.isFinite(capHours) ? capHours * 3600 : Infinity)
    const averagePerHour = countedSeconds > 0 ? offlineIncome / (countedSeconds / 3600) : 0

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
                    <span className="offline-earnings-amount">
                        <AbbreviatedNumber value={displayIncome} icon={cashIcon} iconAlt="£" iconSize={22} iconStyle={{ objectFit: 'contain', marginTop: '3px' }} />
                    </span>
                    {/* What the figure is made of, so a multiplier reads as a breakdown rather than as part of the number */}
                    <span className="offline-earnings-breakdown">
                        {averagePerHour > 0 && <>Averaging <AbbreviatedNumber value={averagePerHour} suffix="/hr" /></>}
                        {doubled && <> × {bonusFactor} {bonusWord} earnings</>}
                    </span>
                    <span className="offline-earnings-note">{Number.isFinite(capHours) ? `Capped at ${capHours} hours` : 'No cap on offline earnings'}</span>
                </div>
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
                        {/* The trophy icon sits flush to the top of its own canvas (no built-in headroom like text's ascender space),
                            is inline with the text (the label is one span), where verticalAlign: middle leaves it a little low, hence the 1px lift. */}
                        {canDouble ? (
                            <span>{bonusWord} it for <img src={reputationIcon} alt="Reputation" style={{ width: '14px', height: '14px', border: 'none', verticalAlign: 'middle', position: 'relative', top: '-1px', margin: '0 3px' }} />20 (<AbbreviatedNumber value={Math.floor(offlineIncome * bonusFactor)} />)</span>
                        ) : (
                            <span>{bonusWord} it: needs <img src={reputationIcon} alt="Reputation" style={{ width: '14px', height: '14px', border: 'none', verticalAlign: 'middle', position: 'relative', top: '-1px', margin: '0 3px' }} />20 (you have {reputation})</span>
                        )}
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