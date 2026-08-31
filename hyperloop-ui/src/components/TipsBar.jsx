import { useState, useEffect } from 'react'
import './TipsBar.css'

const TIPS = [
    "Connect more cities to increase your daily income.",
    "Rank up to unlock new cities to connect.",
    "Build developments to boost your revenue beyond city income.",
    "Re-roll an unlocked city for 15 reputation if it doesn't suit you.",
    "Give personal farewells at the departure board to earn reputation.",
    "Upgrade your developments up to 3 times for a 100% income boost.",
    "Disconnecting a city costs half the connection fee and 20 reputation.",
    "Your terminal earns a small income while you're away.",
    "Tier 2 and 3 cities earn significantly more than Tier 1 cities.",
    "Check your departure board daily for flights to farewell.",
    "Work your terminal manually to earn extra cash between paydays.",
    "Accepting a flight delay costs money but keeps your reputation intact.",
    "Your reputation can never go below zero.",
    "Export your save in Settings to back up your progress.",
    "Developments unlocked by a city stay built even if you disconnect it.",
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