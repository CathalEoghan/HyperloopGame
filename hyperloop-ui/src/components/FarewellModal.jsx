import { useState, useEffect, useRef } from 'react'
import { PrestigeManager } from 'Managers/PrestigeManager/PrestigeManager.js'
import { playLeavingSound, playSpecialChime, playFarewellAcceptSound, playBoardHoverSound as playHoverSound } from '../utils/sound.js'
import reputationIcon from '../assets/misc/reputation.png'
import { minutesUntilDeparture } from '../utils/time.js'
import countryFlags from '../data/countryFlags.js'
import './FarewellModal.css'
import { flagSrc } from '../utils/flagSrc.js'
import { farewellWindowMinutes } from '../utils/loops.js'

const secondsUntil = expiresAt => Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))

function FarewellModal({ departure, onFarewell, onMiss, economyManager }) {
    const [secondsLeft, setSecondsLeft] = useState(() => {
        if (departure.expiresAt) return secondsUntil(departure.expiresAt);
        if (departure.secondsRemaining) return departure.secondsRemaining;
        return farewellWindowMinutes(economyManager?.progressionManager.purchasedUpgrades) * 60
    })

    useEffect(() => {
        // A VIP gets its own chime
        if (departure.vip) playSpecialChime(); else playLeavingSound()
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
    // An arriving loop uses the same popup, to greet its passengers instead of saying goodbye
    const isArrival = departure.kind === 'arrival'
    // The board shows GATE CLOSED for the last 5 minutes, so the announcement matches it
    const gateClosed = !isArrival && minutesUntilDeparture(departure) <= 5
    const repGain = economyManager ? economyManager.getFarewellRepGain(5, !!departure.vip) : 5

    const accept = () => {
        playFarewellAcceptSound()
        onFarewell(repGain)
    }

    // Video Message: the farewell is accepted automatically, after a moment so it can still be seen
    const autoSend = PrestigeManager.owns('videoMessage')
    const sentRef = useRef(false)
    useEffect(() => {
        if (!autoSend) return
        const t = setTimeout(() => {
            if (sentRef.current) return
            sentRef.current = true
            accept()
        }, 2500)
        return () => clearTimeout(t)
    }, [])

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
                <p className={`farewell-timer ${isUrgent ? 'farewell-timer-urgent' : ''}`}>
                    {timeDisplay}
                </p>
                {autoSend ? (
                    <p className="farewell-message" data-testid="video-message">
                        🎥 Sending your video {isArrival ? 'welcome' : 'message'}… (+{repGain} <img src={reputationIcon} alt="reputation" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />)
                    </p>
                ) : (
                    <button className="farewell-button" onMouseEnter={() => playHoverSound()} onClick={() => {
                        if (sentRef.current) return
                        sentRef.current = true
                        accept()
                    }}>
                        {isArrival
                            ? (departure.vip ? 'Give a VIP welcome' : 'Greet the passengers')
                            : (departure.vip ? 'Give a VIP farewell' : 'Give a personal farewell')} (+{repGain} <img src={reputationIcon} alt="reputation" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />)
                    </button>
                )}
            </div>
        </div>
    )
}

export default FarewellModal