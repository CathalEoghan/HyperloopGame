import { useState, useRef, useEffect } from 'react'
import departureBoardImg from '../assets/misc/DepartureBoard.jpg'
import './TopBanner.css'
import clockIcon from '../assets/misc/clock.png'
import cashIcon from '../assets/misc/cash.png'
import starIcon from '../assets/misc/star.png'
import reputationIcon from '../assets/misc/reputation.png'
import { playClickSound2, playClickSound3, playWorkClickSound, playHoverSound } from '../utils/sound.js'

const WORK_PHRASES = [
    'Processed passenger', 'Attended meeting', 'Worked security', 'Shop inspection',
    'Advertising campaign shoot', 'Hired new employee', 'Dealt with complaint',
    'Called engineering team', 'Updated timetable', 'Briefed ground crew',
    'Reviewed safety report', 'Assisted lost traveller', 'Found lost luggage',
    'Met with union leaders', 'Posted to social media', 'Delivered speech to workers',
    'Planned new development', 'Assembled financial advisors'
]

let floatId = 0

function TopBanner({ terminalName, balance, rank, activeTab, onSelect, reputation, onWork, workEarnings, hasFarewellPending, activeEvent, onEventExpire }) {
    const [floats, setFloats] = useState([])
    const [eventSecondsLeft, setEventSecondsLeft] = useState(activeEvent?.durationSeconds || 0)
    const btnRef = useRef(null)
    const [displayBalance, setDisplayBalance] = useState(balance)
    const [displayReputation, setDisplayReputation] = useState(reputation)
    const [balanceFlash, setBalanceFlash] = useState(null)
    const [repFlash, setRepFlash] = useState(null)
    const [balanceFloat, setBalanceFloat] = useState(null)
    const balanceAnimRef = useRef(null)
    const repAnimRef = useRef(null)
    const balanceStartRef = useRef(null)
    const repStartRef = useRef(null)
    const prevBalanceRef = useRef(balance)
    const prevRepRef = useRef(reputation)

    useEffect(() => {
        if (!activeEvent || activeEvent.durationSeconds === 0) return;
        setEventSecondsLeft(activeEvent.durationSeconds);
        const timer = setInterval(() => {
            setEventSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onEventExpire?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [activeEvent?.id]);

    useEffect(() => {
        const diff = balance - prevBalanceRef.current
        if (diff < 0) {
            setBalanceFlash('down')
            setTimeout(() => setBalanceFlash(null), 400)
        }
        if (Math.abs(diff) >= 100) {
            setBalanceFloat({ value: prevBalanceRef.current, id: Date.now(), dir: diff >= 0 ? 'up' : 'down' })
            setTimeout(() => setBalanceFloat(null), 600)
        }
        prevBalanceRef.current = balance
    }, [balance])

    useEffect(() => {
        if (reputation < prevRepRef.current) {
            setRepFlash('down')
            setTimeout(() => setRepFlash(null), 400)
        }
        prevRepRef.current = reputation
    }, [reputation])

    useEffect(() => {
        if (balanceAnimRef.current) cancelAnimationFrame(balanceAnimRef.current)
        const from = displayBalance
        const to = balance
        const diff = to - from
        if (Math.abs(diff) < 1) return
        const duration = Math.abs(diff) < 100 ? 0 : Math.max(250, Math.min(Math.abs(diff) / 10000 * 300, 400))
        if (duration === 0) { setDisplayBalance(Math.floor(to)); return }
        balanceStartRef.current = null
        const animate = (timestamp) => {
            if (!balanceStartRef.current) balanceStartRef.current = timestamp
            const elapsed = timestamp - balanceStartRef.current
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplayBalance(Math.floor(from + diff * eased))
            if (progress < 1) {
                balanceAnimRef.current = requestAnimationFrame(animate)
            } else {
                setDisplayBalance(Math.floor(to))
            }
        }
        balanceAnimRef.current = requestAnimationFrame(animate)
        return () => { if (balanceAnimRef.current) cancelAnimationFrame(balanceAnimRef.current) }
    }, [balance])

    useEffect(() => {
        if (repAnimRef.current) cancelAnimationFrame(repAnimRef.current)
        const from = displayReputation
        const to = reputation
        const diff = to - from
        if (Math.abs(diff) < 1) return
        const duration = Math.abs(diff) < 5 ? 0 : Math.min(Math.abs(diff) * 30, 500)
        if (duration === 0) { setDisplayReputation(Math.floor(to)); return }
        repStartRef.current = null
        const animate = (timestamp) => {
            if (!repStartRef.current) repStartRef.current = timestamp
            const elapsed = timestamp - repStartRef.current
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplayReputation(Math.floor(from + diff * eased))
            if (progress < 1) {
                repAnimRef.current = requestAnimationFrame(animate)
            } else {
                setDisplayReputation(Math.floor(to))
            }
        }
        repAnimRef.current = requestAnimationFrame(animate)
        return () => { if (repAnimRef.current) cancelAnimationFrame(repAnimRef.current) }
    }, [reputation])

    const handleWork = () => {
        const id = floatId++
        const rect = btnRef.current.getBoundingClientRect()
        const phrase = WORK_PHRASES[Math.floor(Math.random() * WORK_PHRASES.length)]
        setFloats(prev => [...prev, { id, phrase, hasRep: false, x: rect.left + rect.width / 2, y: rect.top }])
        setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1500)
        onWork(() => {
            setFloats(prev => prev.map(f => f.id === id ? { ...f, hasRep: true } : f))
        })
        playWorkClickSound()
    }

    const getEventIndicatorText = () => {
        if (!activeEvent) return ''
        const { effectType, title, instantCashAmount } = activeEvent
        if (effectType === 'instantCash') return `${title} — +£${instantCashAmount?.toLocaleString()}`
        if (effectType === 'instantCashLoss') return `${title} — -£${Math.abs(instantCashAmount)?.toLocaleString()}`
        if (effectType === 'passiveBoost') return `${title} — +100% passive income`
        if (effectType === 'passivePenalty') return `${title} — -50% passive income`
        if (effectType === 'workBoost') return `${title} — +50% work earnings`
        if (effectType === 'workPenalty') return `${title} — -50% work earnings`
        return title
    }

    const isInstantEvent = activeEvent?.durationSeconds === 0
    const balanceColor = balanceFlash === 'down' ? '#e74c3c' : '#333'
    const repColor = repFlash === 'down' ? '#e74c3c' : '#333'

    return (
        <>
        <div className="TopBanner">
            <h1 className="TerminalName">{terminalName}</h1>
            <button ref={btnRef} className="work-banner-btn" onClick={handleWork} onMouseEnter={() => playHoverSound()}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    Work (+<img src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{workEarnings.toLocaleString()})
                </span>
            </button>
            <div className="work-divider" />
            <div className="rightSideDetails">
                <div className="time">
                    <img src={clockIcon} alt="time" /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="rank">
                    <img src={starIcon} alt="rank" /> Rank {rank}
                </div>
                <div className="balance" style={{ color: balanceColor, transition: 'color 0.3s ease', position: 'relative' }}>
                    <img src={cashIcon} alt="balance" /> £{displayBalance.toLocaleString()}
                    {balanceFloat && (
                        <span key={balanceFloat.id} style={{
                            position: 'absolute', left: 0, top: 0, width: '100%',
                            color: balanceFloat.dir === 'down' ? '#e74c3c' : '#888',
                            animation: 'stat-float-up 0.6s ease-out forwards',
                            pointerEvents: 'none', whiteSpace: 'nowrap',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            <img src={cashIcon} alt="£" style={{ height: '16px', width: '16px', objectFit: 'contain' }} />
                            £{Math.floor(balanceFloat.value).toLocaleString()}
                        </span>
                    )}
                </div>
                <div className="reputation" style={{ color: repColor, transition: 'color 0.3s ease' }}>
                    <img src={reputationIcon} alt="reputation" /> {displayReputation}
                </div>
            </div>
            <button
                className="MysterySpot"
                onMouseEnter={() => playHoverSound()}
                onClick={() => {
                    if (activeTab === "DepartureBoard") { playClickSound3(); } else { playClickSound2(); }
                    onSelect(activeTab === "DepartureBoard" ? "Home" : "DepartureBoard");
                }}
                style={{ backgroundImage: `url(${departureBoardImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
                <span className="MysterySpotLabel">DEPARTURE BOARD</span>
                {hasFarewellPending && <span className="departure-badge" />}
            </button>
            {floats.map(f => (
                <div key={f.id} className="work-float" style={{ left: f.x, top: f.y }}>
                    <span className="work-float-phrase">{f.phrase}</span>
                    <span className="work-float-earnings" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        +<img src={cashIcon} alt="£" style={{ width: '11px', height: '11px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{workEarnings.toLocaleString()}
                        {f.hasRep && (
                            <>&nbsp;+<img src={reputationIcon} alt="rep" style={{ width: '11px', height: '11px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />5</>
                        )}
                    </span>
                </div>
            ))}
        </div>
        {activeEvent && (
            <div className={`event-indicator ${activeEvent.type === 'positive' ? 'event-indicator-positive' : 'event-indicator-negative'}`}>
                <span className="event-indicator-icon">{activeEvent.type === 'positive' ? '▲' : '▼'}</span>
                <span className="event-indicator-text">{getEventIndicatorText()}</span>
                {!isInstantEvent && <span className="event-indicator-timer">{eventSecondsLeft}s remaining</span>}
            </div>
        )}
        </>
    )
}

export default TopBanner