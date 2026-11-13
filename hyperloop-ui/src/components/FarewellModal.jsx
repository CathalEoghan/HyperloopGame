import { useState, useEffect, useRef } from 'react'
import { playLeavingSound, playFarewellVipSound, playFarewellConfirmSound, playBoardHoverSound as playHoverSound } from '../utils/sound.js'
import reputationIcon from '../assets/misc/reputation.png'
import PersonalStylingBadge from './PersonalStylingBadge.jsx'
import countryFlags from '../data/countryFlags.js'
import './FarewellModal.css'
import { flagSrc } from '../utils/flagSrc.js'
import { farewellWindowMinutes, entryPassengers, entryTimestamp } from '../utils/loops.js'
import { localPhrase } from '../data/localPhrases.js'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'

const secondsUntil = expiresAt => Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))

function FarewellModal({ departure, onFarewell, onMiss, economyManager }) {
    // Escape does nothing here (the farewell has to be answered or left to run out), but it is caught here so it
    // stops at this popup instead of closing the Shop or another panel hidden underneath it
    useEscapeToClose(() => {})
    const [secondsLeft, setSecondsLeft] = useState(() => {
        if (departure.expiresAt) return secondsUntil(departure.expiresAt);
        if (departure.secondsRemaining) return departure.secondsRemaining;
        return farewellWindowMinutes(economyManager?.progressionManager.purchasedUpgrades) * 60
    })

    useEffect(() => {
        // A VIP gets its own chime
        if (departure.vip) playFarewellVipSound(); else playLeavingSound()
        // The fallback count is kept here, not inside a state update, so onMiss never runs during one (bug #175)
        let fallbackLeft = secondsLeft
        const timer = setInterval(() => {
            if (departure.expiresAt) {
                // Read the clock every second, so a sleeping laptop or a throttled tab can't stretch the window
                const left = secondsUntil(departure.expiresAt)
                setSecondsLeft(left)
                if (left <= 0) { clearInterval(timer); onMiss() }
                return
            }
            fallbackLeft -= 1
            setSecondsLeft(Math.max(0, fallbackLeft))
            if (fallbackLeft <= 0) { clearInterval(timer); onMiss() }
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60
    const timeDisplay = `${minutes}:${String(seconds).padStart(2, '0')}`
    const isUrgent = secondsLeft <= 60

    const flagCode = countryFlags[departure.country]
    // The button says the farewell or greeting in the destination's own language (the plain English label is the fallback)
    const phrase = localPhrase(departure.country, departure.kind)
    // An arriving loop uses the same popup, to greet its passengers instead of saying goodbye
    const isArrival = departure.kind === 'arrival'
    // The board shows GATE CLOSED for the last 5 minutes. The standard farewell window opens right at that point,
    // so the popup gives the "final call" wording for its first minute and says the gate is closed after that.
    // Read from the countdown (the window ends as the loop leaves), not the departure's time of day: a farewell
    // that opens just before midnight belongs to tomorrow's 00:05 loop, which a time-of-day check took as gone.
    const gateClosed = !isArrival && Math.ceil(secondsLeft / 60) <= 4
    const repGain = economyManager ? economyManager.getFarewellRepGain(5, !!departure.vip) : 5
    // How many passengers are waiting (or have just arrived): the board's own count for this loop, so the two always agree.
    // The loop's day is the one its time lands nearest to - a farewell that opens just before midnight is for tomorrow's loop.
    const [passengers] = useState(() => {
        try {
            const windowMs = farewellWindowMinutes(economyManager?.progressionManager.purchasedUpgrades) * 60000
            const anchor = departure.expiresAt ? (isArrival ? departure.expiresAt - windowMs : departure.expiresAt) : Date.now()
            const dayMs = [-86400000, 0, 86400000].map(d => Date.now() + d)
                .reduce((best, d) => Math.abs(entryTimestamp(departure, d) - anchor) < Math.abs(entryTimestamp(departure, best) - anchor) ? d : best)
            const n = entryPassengers(isArrival ? 'arrival' : 'departure', dayMs, departure)
            return Number.isFinite(n) && n > 0 ? n : null
        } catch { return null }
    })
    // Personal Styling Retinue's x3 on the first greet/farewell of the day, named below instead of hiding in the figure
    const retinue = economyManager ? economyManager.getFirstLoopBonus() : 0

    // Guards against a fast double-click crediting the same farewell twice before the parent re-render removes this modal
    const sentRef = useRef(false)
    const accept = () => {
        if (sentRef.current) return
        sentRef.current = true
        playFarewellConfirmSound()
        onFarewell(repGain)
    }

    return (
        <div className="farewell-overlay">
            <div className="farewell-modal" data-vip={departure.vip ? 'true' : undefined}>
                <p className="farewell-attention">{departure.vip ? (isArrival ? 'VIP ARRIVAL' : 'VIP PASSENGER') : (isArrival ? 'NOW ARRIVED' : 'ATTENTION')}</p>
                <div className="farewell-divider">━━━━━━━━━━━━━━━━━━━━</div>
                <div className="farewell-destination">
                    {flagCode && (
                        <img
                            src={flagSrc(flagCode)}
                            alt={departure.country}
                            className="farewell-flag"
                        />
                    )}
                    <span className="farewell-city-name">{departure.name}</span>
                </div>
                <p className="farewell-message">
                    {isArrival
                        ? (departure.vip
                            ? <>A VIP has just arrived from <strong>{departure.name}</strong> at Gate <strong>{departure.gate}</strong>. Make sure they get a very special welcome.</>
                            : <>The loop from <strong>{departure.name}</strong> has arrived at Gate <strong>{departure.gate}</strong>. Passengers are making their way through the terminal.</>)
                    : departure.vip
                        ? (gateClosed
                            ? <>A VIP is on board the flight to <strong>{departure.name}</strong>, and Gate <strong>{departure.gate}</strong> has just closed. There is still time to give them a very special farewell.</>
                            : <>A VIP is about to depart for <strong>{departure.name}</strong> from Gate <strong>{departure.gate}</strong>. Don't let them leave without a very special farewell.</>)
                        : gateClosed
                            ? <>Gate <strong>{departure.gate}</strong> is now closed for <strong>{departure.name}</strong>. There is still time to give passengers a personal farewell.</>
                            : <>Final call for passengers travelling to <strong>{departure.name}</strong>. Please proceed to Gate <strong>{departure.gate}</strong>.</>}
                </p>
                {passengers !== null && (
                    <p className="farewell-passengers">
                        {isArrival
                            ? `About ${passengers} ${passengers === 1 ? 'passenger has' : 'passengers have'} just arrived${departure.vip ? ', including a VIP' : ''}.`
                            : `About ${passengers} ${passengers === 1 ? 'passenger is' : 'passengers are'} waiting${departure.vip ? ', including a VIP' : ''}.`}
                    </p>
                )}
                <p className={`farewell-timer ${isUrgent ? 'farewell-timer-urgent' : ''}`}>
                    {timeDisplay}
                </p>
                <PersonalStylingBadge mult={retinue} />
                {/* Video Message owners never see this modal at all - App.jsx credits and shows their own
                    VideoMessageToast instead (see giveFarewell/the videoMessageFlashQueue render site), since
                    this popup's window can expire and must stay interactive for everyone else. */}
                <button className="farewell-button" onMouseEnter={() => playHoverSound()} onClick={accept}>
                    {phrase
                        ? phrase.text
                        : isArrival
                            ? (departure.vip ? 'Give a VIP welcome' : 'Greet the passengers')
                            : (departure.vip ? 'Give a VIP farewell' : 'Give a personal farewell')} (+<img src={reputationIcon} alt="reputation" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />{repGain})
                </button>
            </div>
        </div>
    )
}

export default FarewellModal