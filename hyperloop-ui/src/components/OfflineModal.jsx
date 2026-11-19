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

function OfflineModal({ offlineSeconds, offlineIncome, arrived = 0, departed = 0, passengers = 0, onCollect, reputation, onSpendRep, capHours = 48, bonusFactor = 2 }) {
    const [doubled, setDoubled] = useState(false)
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

    // The figure counts up when the modal opens, and again from the old figure when it's doubled
    const shownIncome = useCountUp(displayIncome)
    // Only mention the cap when it actually cut the payout short
    const wasCapped = Number.isFinite(capHours) && offlineSeconds > capHours * 3600
    const repIcon = <img src={reputationIcon} alt="Reputation" style={{ width: '14px', height: '14px', border: 'none', borderRadius: 0, verticalAlign: 'middle', position: 'relative', top: '-1px', margin: '0 3px 0 2px' }} />

    return (
        <div className="modal-overlay">
            <div className="modal offline-modal">
                {/* Sizes are inline: a bare ".modal img" rule on the Cities page outranks a class here */}
                <img src={helloIcon} alt="hello" className="offline-icon" style={{ width: '64px', height: '64px', objectFit: 'contain', border: 'none', borderRadius: 0 }} />
                <h2 className="offline-title">Welcome back!</h2>
                <p className="offline-subtitle">
                    You were away for <strong>{formatDuration(offlineSeconds)}</strong>
                </p>
                {(arrived > 0 || departed > 0 || passengers > 0) && (
                    <div className="offline-stats">
                        <div className="offline-stat"><strong>{arrived.toLocaleString('en-GB')}</strong><span>{arrived === 1 ? 'arrival' : 'arrivals'}</span></div>
                        <div className="offline-stat"><strong>{departed.toLocaleString('en-GB')}</strong><span>{departed === 1 ? 'departure' : 'departures'}</span></div>
                        {passengers > 0 && <div className="offline-stat"><strong>{passengers.toLocaleString('en-GB')}</strong><span>passengers</span></div>}
                    </div>
                )}
                <div className="offline-earnings-box">
                    <span className="offline-earnings-label">Offline earnings</span>
                    <span className="offline-earnings-amount">
                        <AbbreviatedNumber value={shownIncome} icon={cashIcon} iconAlt="£" iconSize={24} iconStyle={{ objectFit: 'contain' }} exact={false} />
                    </span>
                    {/* What the figure is made of, so a multiplier reads as a breakdown rather than as part of the number */}
                    <span className="offline-earnings-breakdown">
                        {averagePerHour > 0 && <>Averaging <AbbreviatedNumber value={averagePerHour} suffix="/hr" exact={false} /></>}
                        {doubled && <> × {bonusFactor}</>}
                    </span>
                    {wasCapped && (
                        <span className="offline-earnings-note">Capped at {capHours} hours of your {formatDuration(offlineSeconds)} away</span>
                    )}
                </div>
                <div className="offline-actions">
                    {/* Collect is the normal way on, so it's the filled button; doubling is the optional extra */}
                    <button
                        className="offline-collect-btn"
                        onMouseEnter={() => playHoverSound()}
                        onClick={() => { playClickSound2(); onCollect(displayIncome) }}
                    >
                        Collect & Continue
                    </button>
                    {!doubled && (
                        <button
                            className={`offline-double-btn${canDouble ? '' : ' offline-double-btn-locked'}`}
                            onMouseEnter={() => { if (canDouble) playHoverSound() }}
                            onClick={() => {
                                if (!canDouble) { playNotEnoughFundsSound(); return }
                                playClickSound2()
                                onSpendRep(20)
                                setDoubled(true)
                            }}
                        >
                            {/* The reward first, then what it costs, so the figure can't be read as the price */}
                            {canDouble ? (
                                <span>{bonusWord} to <AbbreviatedNumber value={Math.floor(offlineIncome * bonusFactor)} exact={false} /> · {repIcon}20</span>
                            ) : (
                                <span>{bonusWord} it: needs {repIcon}20 (you have {reputation})</span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// Eases a shown number from where it was to the new value over about a second
function useCountUp(target, duration = 900) {
    const [shown, setShown] = useState(0)
    const fromRef = useRef(0)
    const shownRef = useRef(0)
    useEffect(() => {
        fromRef.current = shownRef.current
        const start = performance.now()
        let frame
        const step = (now) => {
            const t = Math.min(1, (now - start) / duration)
            const eased = 1 - Math.pow(1 - t, 3)
            const v = Math.round(fromRef.current + (target - fromRef.current) * eased)
            shownRef.current = v
            setShown(v)
            if (t < 1) frame = requestAnimationFrame(step)
        }
        frame = requestAnimationFrame(step)
        return () => cancelAnimationFrame(frame)
    }, [target, duration])
    return shown
}

export default OfflineModal