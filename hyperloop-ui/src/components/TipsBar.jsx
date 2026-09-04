import { useState, useEffect } from 'react'
import './TipsBar.css'

const TIPS = [
    "Connect more cities to increase your daily income — Tier 3 cities earn the most.",
    "Rank up to unlock new cities. Re-roll an unwanted city for 15 Reputation.",
    "Build developments to boost your revenue beyond city income alone.",
    "Upgrade your developments up to 3 times for up to a 100% income boost.",
    "Give personal farewells at the departure board to earn +5 Reputation.",
    "Work your terminal manually for extra cash — and a rare chance at Reputation.",
    "Disconnecting a city costs half the connection fee and 20 Reputation.",
    "Your terminal earns income while you're away, capped at 48 hours by default.",
    "Certain upgrades extend your offline earnings cap up to 7 days.",
    "Accepting a flight delay costs money but keeps your Reputation intact.",
    "Your Reputation can never go below zero.",
    "Export your save in Settings to back up your progress.",
    "Developments unlocked by a city stay built even if you disconnect it.",
    "Upgrades boost your entire network — from city income to delay costs.",
    "Southern hemisphere cities earn a bonus with the right upgrade.",
    "Connect cities across multiple continents to maximise expansion bonuses.",
    "Random events can multiply your passive income or work earnings temporarily.",
    "Building an Event Hall increases your chances of positive events.",
    "The Passenger Loyalty Scheme earns you +5 Reputation every day you log in.",
    "Commemorative Displays doubles your daily login bonus to £50,000.",
    "Your home city's country earns local transport bonuses from certain upgrades.",
    "The first farewell you give each day can earn double Reputation with the right upgrade.",
    "Seasonal packages boost your income during their respective season.",
    "City advertising campaigns boost all income from cities in that country.",
    "Check the Settings page to manually save, export, or back up your progress.",
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
            <button className="tips-dismiss" onClick={() => setVisible(false)}>✕</button>
        </div>
    )
}

export default TipsBar