import { useState, useEffect, useRef } from 'react'
import './TickerBar.css'
import { minutesUntilDeparture } from '../utils/time.js'
import { arrivalsKey, readSchedule } from '../utils/loops.js'

function TickerBar({ terminalName }) {
    const [messages, setMessages] = useState([])
    // The announcements are refreshed by a timer set up once, so it reads the name through this
    const terminalNameRef = useRef(terminalName)
    useEffect(() => { terminalNameRef.current = terminalName }, [terminalName])

    function getActiveMessages(schedule) {
        const msgs = []
        schedule.forEach(entry => {
            const diff = minutesUntilDeparture(entry)
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
        const msgs = saved ? getActiveMessages(JSON.parse(saved)) : []
        // Loops that have just come in, or are about to
        readSchedule(arrivalsKey()).forEach(entry => {
            const diff = minutesUntilDeparture(entry)
            if (diff > 0 && diff <= 10) {
                msgs.push(`Attention: The ${entry.time} hyperloop from ${entry.name} will shortly arrive at Gate ${entry.gate}.`)
            } else if (diff <= 0 && diff > -10) {
                msgs.push(`Attention: The hyperloop from ${entry.name} has arrived at Gate ${entry.gate}. Welcome to ${terminalNameRef.current}.`)
            }
        })
        setMessages(msgs)
    }

    useEffect(() => {
        loadMessages()
        const interval = setInterval(loadMessages, 30000)
        return () => clearInterval(interval)
    }, [])

    const idleMessages = [
    `Welcome to ${terminalName}. Thank you for travelling with us today.`,
    'Please keep your belongings close to you at all times.',
    `${terminalName} operates 24 hours a day, 7 days a week.`,
    'Please report any unattended luggage to a member of staff.',
    'We wish you a pleasant journey.',
    'Departure updates will display here. Please stand by.',
]

    const displayMessages = messages.length > 0 ? messages : idleMessages
    const text = displayMessages.join('     ✦     ') + '     ✦     '
    // The text moves at the same speed however long it is: a busy timetable can have a dozen announcements at once,
    // and squeezing them all into the usual 60 seconds made them race past too fast to read
    const scrollSeconds = Math.max(60, Math.round(text.length * 0.16))

    return (
        <div className="ticker-bar">
            <div className="ticker-inner" style={{ animationDuration: `${scrollSeconds}s` }}>
                {text}
            </div>
        </div>
    )
}

export default TickerBar