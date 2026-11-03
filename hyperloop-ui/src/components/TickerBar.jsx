import { useState, useEffect, useRef } from 'react'
import './TickerBar.css'
import { minutesUntilDeparture } from '../utils/time.js'
import { arrivalsKey, readSchedule } from '../utils/loops.js'
import { loopCode } from '../utils/loopCodes.js'

function TickerBar({ terminalName, purchasedCities }) {
    const [messages, setMessages] = useState([])
    // The announcements are refreshed by a timer set up once, so they read the name and the connected
    // cities (for loopCode's departure-pool reconciliation) through these rather than stale closures
    const terminalNameRef = useRef(terminalName)
    useEffect(() => { terminalNameRef.current = terminalName }, [terminalName])
    const purchasedCitiesRef = useRef(purchasedCities)
    useEffect(() => { purchasedCitiesRef.current = purchasedCities }, [purchasedCities])

    function getActiveMessages(schedule) {
        const msgs = []
        schedule.forEach(entry => {
            const diff = minutesUntilDeparture(entry)
            const code = loopCode(entry.name, 'departure', purchasedCitiesRef.current, terminalNameRef.current, entry.loopNumber)
            if (diff > 30 && diff <= 45) {
                msgs.push(`Notice: Gate ${entry.gate} is now open for the ${entry.time} ${code} service to ${entry.name}.`)
            } else if (diff > 10 && diff <= 30) {
                msgs.push(`Attention: The ${entry.time} hyperloop ${code} to ${entry.name} is now boarding at Gate ${entry.gate}.`)
            } else if (diff > 5 && diff <= 10) {
                msgs.push(`Attention: Final call for passengers travelling on the ${entry.time} ${code} service to ${entry.name}. Please proceed to Gate ${entry.gate} immediately.`)
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
            const code = loopCode(entry.name, 'arrival', purchasedCitiesRef.current)
            if (diff > 0 && diff <= 10) {
                msgs.push(`Notice: The ${code} service from ${entry.name} is now approaching Gate ${entry.gate}.`)
            } else if (diff <= 0 && diff > -10) {
                msgs.push(`Attention: The ${code} service from ${entry.name} has arrived at Gate ${entry.gate}. Welcome to ${terminalNameRef.current}.`)
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
    'Please report any unattended baggage to a member of our security team.',
    'We wish you a pleasant journey.',
    'Departure and arrival updates will display here.',
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