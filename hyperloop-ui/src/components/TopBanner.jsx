import { useState, useRef, useEffect } from 'react'
import departureBoardImg from '../assets/misc/DepartureBoard.jpg'
import './TopBanner.css'
import clockIcon from '../assets/misc/clock.png'
import cashIcon from '../assets/misc/cash.png'
import starIcon from '../assets/misc/star.png'
import reputationIcon from '../assets/misc/reputation.png'
import { playClickSound2, playClickSound3, playWorkClickSound, playHoverSound } from '../utils/sound.js'

const WORK_PHRASES = [
    'Processed passenger',
    'Attended meeting',
    'Worked security',
    'Shop inspection',
    'Advertising campaign shoot',
    'Hired new employee',
    'Dealt with complaint',
    'Called engineering team',
    'Updated timetable',
    'Briefed ground crew',
    'Reviewed safety report',
    'Assisted lost traveller',
    'Found lost luggage',
    'Met with union leaders',
    'Posted to social media',
    'Delivered speech to workers',
    'Planned new development',
    'Assembled financial advisors'
]

let floatId = 0

function TopBanner({ terminalName, balance, rank, activeTab, onSelect, reputation, onWork, workEarnings, hasFarewellPending, activeEvent }) {
    const [floats, setFloats] = useState([])
    const [eventSecondsLeft, setEventSecondsLeft] = useState(activeEvent?.durationSeconds || 0)
    const btnRef = useRef(null)
    const [displayBalance, setDisplayBalance] = useState(balance)
    const animationRef = useRef(null)
    const startTimeRef = useRef(null)

    useEffect(() => {
        if (!activeEvent) return;
        setEventSecondsLeft(activeEvent.durationSeconds);
        const timer = setInterval(() => {
            setEventSecondsLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [activeEvent?.id]);

    useEffect(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        const from = displayBalance
        const to = balance
        const diff = to - from
        if (Math.abs(diff) < 1) return
        const duration = Math.min(Math.abs(diff) / 10000 * 300, 600)
        startTimeRef.current = null
        const animate = (timestamp) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp
            const elapsed = timestamp - startTimeRef.current
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplayBalance(Math.floor(from + diff * eased))
            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate)
            } else {
                setDisplayBalance(Math.floor(to))
            }
        }
        animationRef.current = requestAnimationFrame(animate)
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
    }, [balance])

    const handleWork = () => {
        onWork(() => {
            const id = floatId++
            const rect = btnRef.current.getBoundingClientRect()
            setFloats(prev => [...prev, { id, isRep: true, x: rect.left + rect.width / 2, y: rect.top }])
            setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1500)
        })
        playWorkClickSound()
        const phrase = WORK_PHRASES[Math.floor(Math.random() * WORK_PHRASES.length)]
        const id = floatId++
        const rect = btnRef.current.getBoundingClientRect()
        setFloats(prev => [...prev, { id, phrase, isRep: false, x: rect.left + rect.width / 2, y: rect.top }])
        setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1500)
    }

    const getEventIndicatorText = () => {
        if (!activeEvent) return ''
        const { effectType, title, instantCashAmount } = activeEvent
        if (effectType === 'instantCash') return `${title} — +£${instantCashAmount?.toLocaleString()}`
        if (effectType === 'instantCashLoss') return `${title} — -£${Math.abs(instantCashAmount)?.toLocaleString()}`
        if (effectType === 'passiveBoost') return `${title} — +50% passive income`
        if (effectType === 'passivePenalty') return `${title} — -50% passive income`
        if (effectType === 'workBoost') return `${title} — +50% work earnings`
        if (effectType === 'workPenalty') return `${title} — -50% work earnings`
        return title
    }

    const isInstantEvent = activeEvent?.effectType === 'instantCash' || activeEvent?.effectType === 'instantCashLoss'

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
                <div className="balance">
                    <img src={cashIcon} alt="balance" /> £{displayBalance.toLocaleString()}
                </div>
                <div className="reputation">
                    <img src={reputationIcon} alt="reputation" /> {reputation}
                </div>
            </div>
            <button
                className="MysterySpot"
                onMouseEnter={() => playHoverSound()}
                onClick={() => {
                    if (activeTab === "DepartureBoard") {
                        playClickSound3();
                    } else {
                        playClickSound2();
                    }
                    onSelect(activeTab === "DepartureBoard" ? "Home" : "DepartureBoard");
                }}
                style={{
                    backgroundImage: `url(${departureBoardImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <span className="MysterySpotLabel">DEPARTURE BOARD</span>
                {hasFarewellPending && <span className="departure-badge" />}
            </button>
            {floats.map(f => (
                <div key={f.id} className="work-float" style={{ left: f.x, top: f.y }}>
                    {f.isRep ? (
                        <span className="work-float-earnings" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            +<img src={reputationIcon} alt="rep" style={{ width: '11px', height: '11px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />5 Reputation
                        </span>
                    ) : (
                        <>
                            <span className="work-float-phrase">{f.phrase}</span>
                            <span className="work-float-earnings" style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                                +<img src={cashIcon} alt="£" style={{ width: '11px', height: '11px', verticalAlign: 'middle', border: 'none', borderRadius: '0', display: 'inline-block' }} />{workEarnings.toLocaleString()}
                            </span>
                        </>
                    )}
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