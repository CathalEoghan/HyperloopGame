import { useState, useEffect } from 'react'
import './TickerBar.css'

function TickerBar() {
    const [messages, setMessages] = useState([])

    function getActiveMessages(schedule) {
        const now = new Date()
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        const msgs = []
        schedule.forEach(entry => {
            const diff = (entry.hour * 60 + entry.minute) - currentMinutes
            if (diff > 30 && diff <= 45) {
                msgs.push(`Attention: Passengers travelling to ${entry.name} for a ${entry.time} departure are advised to go to Gate ${entry.gate}.`)
            } else if (diff > 10 && diff <= 30) {
                msgs.push(`Attention: The ${entry.time} hyperloop to ${entry.name} is now boarding at Gate ${entry.gate}.`)
            } else if (diff > 5 && diff <= 10) {
                msgs.push(`Attention: Final call for passengers travelling to ${entry.name}. Go to Gate ${entry.gate} immediately.`)
            }
        })
        return msgs
    }

    function loadMessages() {
        const today = new Date().toDateString()
        const saved = localStorage.getItem(`departures_${today}`)
        if (saved) setMessages(getActiveMessages(JSON.parse(saved)))
    }

    useEffect(() => {
        loadMessages()
        const interval = setInterval(loadMessages, 30000)
        return () => clearInterval(interval)
    }, [])

    const idleMessages = [
        'Welcome to Hyperloop Central. Thank you for travelling with us today.',
        'Please keep your belongings close to you at all times.',
        'Hyperloop Central operates 24 hours a day, 7 days a week.',
        'Please report any unattended luggage to a member of staff.',
        'We wish you a pleasant journey.',
    ]

    const displayMessages = messages.length > 0 ? messages : idleMessages
    const text = displayMessages.join('     ✦     ') + '     ✦     '

    return (
        <div className="ticker-bar">
            <div className="ticker-inner">
                {text}
            </div>
        </div>
    )
}

export default TickerBar