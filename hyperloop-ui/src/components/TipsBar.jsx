import { useState, useEffect } from 'react'
import './TipsBar.css'
import { playClickSound2, playHoverSound } from '../utils/sound.js'
import closeIcon from '../assets/misc/close.png'

const TIPS = [
    "Connect more cities to increase your daily income.",
    "Rank up to unlock new cities to connect.",
    "Build developments to boost your revenue beyond city income.",
    "Re-roll your city choices for Reputation if none of them suit you.",
    "When a departure or arrival is announced, give a personal farewell or greeting to earn reputation.",
    "Upgrade your developments up to 10 times for up to a 450% income boost.",
    "By default, disconnecting a city costs half the connection fee and 20 reputation.",
    "Your terminal earns income while you're away, capped at 48 hours by default - certain upgrades extend that up to 7 days.",
    "Prestige upgrades are powerful modifiers that can significantly augment your runs.",
    "Tier 2 and 3 cities earn significantly more than Tier 1 cities, but cost more to connect and take longer to build.",
    "Work your terminal manually to earn extra cash.",
    "Compensating passengers after a loop delay costs money but keeps your reputation intact.",
    "Developments unlocked by a city stay built even if you disconnect it.",
    "Export your save in Settings to back up your progress.",
    "Some developments add flat income, while others are powerful modifiers that boost other parts of your network instead.",
    "Make sure to add or automate destinations to the departure board - automating costs reputation, and scheduling by hand is free.",
    "Your reputation or treasury can never go below zero.",
    "VIP passengers show up occasionally - farewell or greet them for 5x the usual reputation.",
    "Reach Rank 50 and buy Early Retirement to unlock Prestige, resetting your run for permanent bonuses that carry forward.",
    "Farewell windows open 5 minutes before each departure - extend them with upgrades to give yourself more time.",
    "Check Hyper-Link, the phone icon on the home screen, to see what passengers are saying about your terminal.",
    "Check the Progress page often! Newly connected cities and countries glow gold and reward you with cash or reputation.",
    "Check the credits modal in Settings for asset accreditations and a surprise!",
    "Check out the shop for cool cosmetics! Choose from a wide selection of themes, cursors, and even custom audio.",
    "Certain ranks (10, 25, 100, 200) hand you a free milestone upgrade automatically when you reach them.",
    "A Celebrity Sighting event marks one of your upcoming departures - keep an eye on the departure board!",
    "Unlocking achievements can boost your Work earnings, with the right upgrade.",
    "A gate can't be reused for 30 minutes after a loop leaves it — plan your timetable with some spacing.",
    "Developments earn more income the busier your terminal is - both departures and arrivals contribute to passenger footfall.",
    "Check the Guide in Settings for a full rundown of every mechanic — Working, Ranking Up, Reputation, Prestige, and more.",
    "Turn on Browser Notifications in Settings to get alerted about departures, arrivals, delays, events or rank-ups even when the tab's in the background."
]

function TipsBar() {
    const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length))
    const [visible, setVisible] = useState(true)
    const [fading, setFading] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            setFading(true)
            setTimeout(() => {
                setTipIndex(i => (i + 1) % TIPS.length)
                setFading(false)
            }, 500)
        }, 12000)
        return () => clearInterval(interval)
    }, [])

    if (!visible) return null

    return (
        <div className={`tips-bar ${fading ? 'tips-fading' : ''}`}>
            <span className="tips-label">TIP</span>
            <span className="tips-text">{TIPS[tipIndex]}</span>
            <button className="tips-dismiss" onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); setVisible(false) }}><img src={closeIcon} alt="" className="modal-close-icon" /></button>
        </div>
    )
}

export default TipsBar