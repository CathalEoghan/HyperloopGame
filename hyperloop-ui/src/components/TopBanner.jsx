import { useState, useRef, useEffect } from 'react'
import departureBoardImg from '../assets/misc/DepartureBoard.jpg'
import './TopBanner.css'
import clockIcon from '../assets/misc/clock.png'
import cashIcon from '../assets/misc/cash.png'
import shoppingIcon from '../assets/misc/shopping.png'
import emailIcon from '../assets/misc/email.png'
import starIcon from '../assets/misc/star.png'
import reputationIcon from '../assets/misc/reputation.png'
import pinIcon from '../assets/misc/pin.png'
import increaseIcon from '../assets/misc/increase.png'
import decreaseIcon from '../assets/misc/decrease.png'
import countryFlags from '../data/countryFlags.js'
import { playClickSound2, playClickSound3, playWorkClickSound, playHoverSound } from '../utils/sound.js'
import { formatCompact } from '../utils/formatCompact.js'
import { BIG_NUMBER_TIERS, scaleToTier } from '../utils/bigNumbers.js'
import { flagSrc } from '../utils/flagSrc.js'

const WORK_PHRASES = [
    'Processed passenger', 'Attended meeting', 'Worked security', 'Shop inspection',
    'Acted in a commercial', 'Hired new employee', 'Dealt with complaint',
    'Called engineering team', 'Updated timetable', 'Briefed ground crew',
    'Reviewed safety report', 'Assisted lost traveller', 'Found lost luggage',
    'Met with union leaders', 'Posted to social media', 'Delivered speech to workers',
    'Planned new development', 'Assembled financial advisors', 'Examined pod maintenance logs',
    'Negotiated new route contract', 'Gave a promotion', 'Cleaned the office', 'Took a day off',
    'Greeted arriving delegation', 'Video-called friends', 'Inspected pods', 'Slacked off', 'Had a snack',
    'Reviewed passenger feedback', 'Read a newspaper', 'Reflected on progress', 'Welcomed foreign investors',
    'Signed off on construction plans', 'Watered office plants', 'Ate a donut', 'Chatted with secretary',
    'Attended press briefing', 'Attended a function', 'Attended a gala', 'Attended a charity ball',
    'Conducted staff training', 'Conducted interviews', 'Made a coffee', 'Argued with lawyers',
    'Helped lost traveller', 'Played a game', 'Hid in the office', 'Left early', 'Wandered the terminal'
]

let floatId = 0

// The cash and Reputation counters: full digits with commas below a million, then "1.50 million", "4.56 billion" and so on
const formatCounter = (value) => formatCompact(Math.floor(value), 1_000_000)

// 1.2k, 3.4m, 5.6b ... through the short names in bigNumbers.js; scientific notation for a tier with no name
const formatWorkAmount = (value, tilde = false) => {
    const t = tilde ? '~' : ''
    if (!Number.isFinite(value)) return `0${t}`
    if (value < 1000) return `${Math.round(value)}${t}`
    const { tier, scaled } = scaleToTier(value, 1)
    const suffix = tier === 1 ? 'k' : BIG_NUMBER_TIERS[tier]?.[1]
    if (!suffix) return `${value.toExponential(1).replace('e+', 'e')}${t}`
    return `${scaled.toFixed(1)}${suffix}${t}`
}

function TopBanner({ terminalName, balance, rank, activeTab, onSelect, reputation, onWork, autoWork, autoWorkTick, workRange, hasFarewellPending, activeEvent, onEventExpire, homeCity, onOpenShop, onOpenEmails, unreadEmails = 0, emailBubble = false, workDisabled = false }) {
    const [floats, setFloats] = useState([])
    // Seconds until the event's real end time, so a restored event does not restart its count after the loading screen (bug #122)
    const eventRemaining = (ev) => ev?.expiresAt ? Math.max(0, Math.ceil((ev.expiresAt - Date.now()) / 1000)) : (ev?.durationSeconds || 0)
    const [eventSecondsLeft, setEventSecondsLeft] = useState(() => eventRemaining(activeEvent))
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
    // Store each flash/float's own timeout id so a second change arriving within the window (e.g. a delay
    // payout immediately followed by a passive-income tick) cancels the still-pending timeout from the first
    // change before it fires - otherwise that stale timeout clears the indicator the second change just set,
    // even though a newer one is what's actually supposed to be showing.
    const balanceFlashTimerRef = useRef(null)
    const balanceFloatTimerRef = useRef(null)
    const repFlashTimerRef = useRef(null)
    useEffect(() => () => {
        clearTimeout(balanceFlashTimerRef.current)
        clearTimeout(balanceFloatTimerRef.current)
        clearTimeout(repFlashTimerRef.current)
    }, [])

    useEffect(() => {
        if (!activeEvent || activeEvent.durationSeconds === 0) return;
        setEventSecondsLeft(eventRemaining(activeEvent));
        // Counted here rather than inside a state update: ending the event updates App, which React does not allow
        // from inside another component's state update (bug #175)
        let left = eventRemaining(activeEvent);
        const timer = setInterval(() => {
            left = activeEvent.expiresAt ? eventRemaining(activeEvent) : left - 1;
            if (left <= 0) {
                clearInterval(timer);
                setEventSecondsLeft(0);
                onEventExpire?.();
                return;
            }
            setEventSecondsLeft(left);
        }, 1000);
        return () => clearInterval(timer);
        // Also restart on expiresAt, not just id: the interval's own `activeEvent` is captured once, when it
        // starts, so if the same event (same id) ever got a new expiresAt - e.g. a duration-extending upgrade
        // applying after it had already fired - this would otherwise go on ticking down from the stale time it
        // had at that point, same as EventModal's own key (id-expiresAt-instantCashAmount, below) already treats
        // a changed expiresAt as effectively a different event.
    }, [activeEvent?.id, activeEvent?.expiresAt]);

    useEffect(() => {
        const diff = balance - prevBalanceRef.current
        if (diff < 0) {
            clearTimeout(balanceFlashTimerRef.current)
            setBalanceFlash('down')
            balanceFlashTimerRef.current = setTimeout(() => setBalanceFlash(null), 400)
        }
        // The old value only floats away when the balance reads differently: at 1.20 million it takes ten thousand to move
        // the printed number, and until then the same text would float up on every tick
        if (Math.abs(diff) >= 100 && formatCounter(prevBalanceRef.current) !== formatCounter(balance)) {
            clearTimeout(balanceFloatTimerRef.current)
            setBalanceFloat({ value: prevBalanceRef.current, id: Date.now(), dir: diff >= 0 ? 'up' : 'down' })
            balanceFloatTimerRef.current = setTimeout(() => setBalanceFloat(null), 600)
        }
        prevBalanceRef.current = balance
    }, [balance])

    useEffect(() => {
        if (reputation < prevRepRef.current) {
            clearTimeout(repFlashTimerRef.current)
            setRepFlash('down')
            repFlashTimerRef.current = setTimeout(() => setRepFlash(null), 400)
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

    // Best P.A. Ever clicks Work for you: the button pulses and shows the same message a click does, with no sound
    useEffect(() => {
        if (!autoWork || !autoWorkTick || document.hidden) return
        const btn = btnRef.current
        if (!btn) return
        if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            btn.animate(
                [
                    { boxShadow: '0 0 0 0 color-mix(in srgb, var(--ui-accent, #f5a623) 70%, transparent)', transform: 'scale(1.04)' },
                    { boxShadow: '0 0 0 10px color-mix(in srgb, var(--ui-accent, #f5a623) 0%, transparent)', transform: 'scale(1)' },
                ],
                { duration: 450, easing: 'ease-out' }
            )
        }
        const id = floatId++
        const rect = btn.getBoundingClientRect()
        const phrase = WORK_PHRASES[Math.floor(Math.random() * WORK_PHRASES.length)]
        setFloats(prev => [...prev, { id, phrase: autoWorkTick.livestreamed ? 'LIVESTREAM IT!' : phrase, livestream: !!autoWorkTick.livestreamed, hasRep: autoWorkTick.reps > 0, repGain: autoWorkTick.reps, earned: autoWorkTick.earned, x: rect.left + rect.width / 2, y: rect.top }])
        // Not cancelled when the next click arrives: each message removes itself, as the manual ones do
        setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1500)
    }, [autoWorkTick])  // eslint-disable-line react-hooks/exhaustive-deps

    const handleWork = () => {
        if (workDisabled) return
        const id = floatId++
        const rect = btnRef.current.getBoundingClientRect()
        const phrase = WORK_PHRASES[Math.floor(Math.random() * WORK_PHRASES.length)]
        setFloats(prev => [...prev, { id, phrase, hasRep: false, x: rect.left + rect.width / 2, y: rect.top }])
        setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1500)
        onWork((earned, gotRep, repAmount, livestreamed) => {
            // The click that pays the Livestream Everything / Streaming Mastery bonus gets its own message in place of a random one
            setFloats(prev => prev.map(f => f.id === id ? { ...f, hasRep: gotRep, earned, repGain: repAmount, ...(livestreamed ? { phrase: 'LIVESTREAM IT!', livestream: true } : {}) } : f))
        })
        playWorkClickSound()
    }

    const getEventIndicatorText = () => {
        if (!activeEvent) return ''
        const { effectType, title, instantCashAmount } = activeEvent
        // Home cities don't all use £, so the amount is shown next to the generic cash icon rather than a £ sign (bug #211)
        const cashIconEl = <img src={cashIcon} alt="cash" className="cash-icon" style={{ width: '12px', height: '12px', verticalAlign: 'middle' }} />
        // Pizza Parties' doubling, already in the figures below - tagged here too, same as on the event popup itself,
        // since this banner stays up for the whole event after the popup is closed
        const pizza = activeEvent.pizzaBoosted ? ' (×2 - Pizza Parties)' : ''
        if (effectType === 'instantCash') return <>{title} — +{cashIconEl}{instantCashAmount?.toLocaleString('en-GB', { maximumFractionDigits: 0 })}{pizza}</>
        if (effectType === 'instantCashLoss') return <>{title} — -{cashIconEl}{Math.abs(instantCashAmount)?.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</>
        if (effectType === 'passiveBoost') return `${title} — +${Math.round(((activeEvent.effect?.multiplier ?? 2) - 1) * 100)}% passive income${pizza}`
        if (effectType === 'passivePenalty') return `${title} — -50% passive income`
        if (effectType === 'workBoost') return `${title} — +${Math.round(((activeEvent.effect?.multiplier ?? 1.5) - 1) * 100)}% work earnings${pizza}`
        if (effectType === 'workPenalty') return `${title} — -50% work earnings`
        return title
    }

    // Shown next to the countdown on the persistent event banner: "(+x% longer)" when a positive event's
    // duration upgrades stretched it, "(x% shorter)" when Resilience cut a negative one short.
    const durationModifierText = activeEvent?.durationModifier
        ? ` (${activeEvent.durationModifier.direction === 'longer' ? '+' : ''}${activeEvent.durationModifier.percent}% ${activeEvent.durationModifier.direction})`
        : ''

    const isInstantEvent = activeEvent?.durationSeconds === 0
    // Green / red outline on the Work button while an event that changes Work earnings specifically is running
    // (workBoost = positive, workPenalty = negative). Other events (passive income, instant cash) don't touch it.
    const workEventTone = isInstantEvent ? null
        : activeEvent?.effectType === 'workBoost' ? 'boost'
        : activeEvent?.effectType === 'workPenalty' ? 'penalty'
        : null
    // Follows the equipped theme's bar text colour (same var .time/.rank already use via CSS) so balance and
    // reputation stay readable on a dark bar theme - was hardcoded dark grey, invisible on themes like Rockstar.
    const balanceColor = balanceFlash === 'down' ? '#e74c3c' : '#222'
    const repColor = repFlash === 'down' ? '#e74c3c' : '#222'

    return (
        <>
        <div className="TopBanner">
            <div className="TopBannerLeft">
            <div className="TerminalNameBlock">
                <h1 className="TerminalName" title={terminalName}>{terminalName}</h1>
                {homeCity && (
                    <div className="HomeCity">
                        <img src={pinIcon} alt="pin" style={{ width: '10px', height: '10px', border: 'none', borderRadius: '0', opacity: 0.6 }} />
                        <img src={flagSrc(countryFlags[homeCity.country])} alt={homeCity.country} style={{ width: '16px', height: '11px', objectFit: 'cover', borderRadius: '1px' }} />
                        <span>{homeCity.name}, {homeCity.country}</span>
                    </div>
                )}
            </div>
            {onOpenShop && (
                <>
                    <div className="work-divider" />
                    <button className="ShopButton" onClick={() => { playClickSound2(); onOpenShop() }} onMouseEnter={() => playHoverSound()} aria-label="Open the Shop">
                        <img src={shoppingIcon} alt="" className="ShopButtonIcon" />
                        <span>Shop</span>
                    </button>
                </>
            )}
            {onOpenEmails && (
                <div className="EmailsButtonWrap">
                    {emailBubble && <div className="EmailsBubble">New email!</div>}
                    <button className="ShopButton EmailsButton" onClick={() => { playClickSound2(); onOpenEmails() }} onMouseEnter={() => playHoverSound()} aria-label="Open your emails">
                        <img src={emailIcon} alt="" className="ShopButtonIcon" />
                        <span>Emails</span>
                        {unreadEmails > 0 && <span className="EmailsBadge">{unreadEmails > 9 ? '9+' : unreadEmails}</span>}
                    </button>
                </div>
            )}
            </div>
           <button ref={btnRef} className={`work-banner-btn${autoWork ? ' work-banner-auto' : ''}${workEventTone ? ` work-event-${workEventTone}` : ''}`} onClick={handleWork} onKeyDown={e => { if (e.repeat) e.preventDefault() }} onMouseEnter={() => playHoverSound()}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    Work (+<img src={cashIcon} alt="£" style={{ width: '14px', height: '14px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{formatWorkAmount(((workRange?.low || 0) + (workRange?.high || 0)) / 2, workRange?.low !== workRange?.high)})
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
                    <img src={cashIcon} alt="balance" /> {formatCounter(displayBalance)}
                    {balanceFloat && (
                        <span key={balanceFloat.id} style={{
                            position: 'absolute', left: 10, top: 5, width: 'calc(100% - 10px)',
                            color: balanceFloat.dir === 'down' ? '#e74c3c' : '#888',
                            animation: 'stat-float-up 0.6s ease-out forwards',
                            pointerEvents: 'none', whiteSpace: 'nowrap',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            <img src={cashIcon} alt="£" style={{ height: '16px', width: '16px', objectFit: 'contain' }} />
                            {formatCounter(balanceFloat.value)}
                        </span>
                    )}
                </div>
                <div className="reputation" style={{ color: repColor, transition: 'color 0.3s ease' }}>
                    <img src={reputationIcon} alt="reputation" /> {formatCounter(displayReputation)}
                </div>
            </div>
            <button
                className="MysterySpot"
                onMouseEnter={() => playHoverSound()}
                onClick={() => {
                    if (activeTab === "DepartureBoard") { playClickSound3(); } else { playClickSound2(); }
                    onSelect(activeTab === "DepartureBoard" ? "Home" : "DepartureBoard");
                }}
                style={{ '--board-img-fallback': `url(${departureBoardImg})` }}
            >
                <span className="MysterySpotLabel">TERMINAL BOARD</span>
                {hasFarewellPending && <span className="departure-badge" />}
            </button>
            {floats.map(f => (
                <div key={f.id} className="work-float" style={{ left: f.x, top: f.y }}>
                    <span className={`work-float-phrase${f.livestream ? ' work-float-livestream' : ''}`}>{f.phrase}</span>
                    <span className="work-float-earnings" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        +<img src={cashIcon} alt="£" style={{ width: '11px', height: '11px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{formatWorkAmount(f.earned || (workRange?.low || 0))}
                        {f.hasRep && (
                            <>&nbsp;+<img src={reputationIcon} alt="rep" style={{ width: '11px', height: '11px', verticalAlign: 'middle', border: 'none', borderRadius: '0' }} />{f.repGain || 5}</>
                        )}
                    </span>
                </div>
            ))}
        </div>
        {activeEvent && (
            <div className={`event-indicator ${activeEvent.type === 'positive' ? 'event-indicator-positive' : 'event-indicator-negative'}`}>
                <img className="event-indicator-icon" src={activeEvent.type === 'positive' ? increaseIcon : decreaseIcon} alt="" />
                <span className="event-indicator-text">{getEventIndicatorText()}</span>
                {!isInstantEvent && <span className="event-indicator-timer">{eventSecondsLeft}s remaining{durationModifierText}</span>}
            </div>
        )}
        </>
    )
}

export default TopBanner