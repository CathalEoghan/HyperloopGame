import { useState, useEffect, useRef } from 'react'
import './TickerBar.css'
import { arrivalsKey, departuresKey, readSchedule, entryTimestamp, shiftDays, timeString } from '../utils/loops.js'
import { readTimetable } from '../utils/timetable.js'
import { loopCode } from '../utils/loopCodes.js'

function TickerBar({ terminalName, purchasedCities }) {
    const [messages, setMessages] = useState([])
    // The announcements are refreshed by a timer set up once, so they read the name and the connected
    // cities (for loopCode's departure-pool reconciliation) through these rather than stale closures
    const terminalNameRef = useRef(terminalName)
    useEffect(() => { terminalNameRef.current = terminalName }, [terminalName])
    const purchasedCitiesRef = useRef(purchasedCities)
    useEffect(() => { purchasedCitiesRef.current = purchasedCities }, [purchasedCities])

    // Whole minutes from now until an entry on the given day's board (negative once it has gone)
    const minutesUntil = (entry, dayMs, nowMs) => Math.round(entryTimestamp(entry, dayMs) / 60000) - Math.floor(nowMs / 60000)

    // Tomorrow's departures before its board exists (it is written at midnight): the timetable, which repeats every day
    function tomorrowsDepartures(tomorrowMs) {
        const key = departuresKey(tomorrowMs)
        if (localStorage.getItem(key) !== null) return readSchedule(key)
        const cities = purchasedCitiesRef.current || []
        const connected = new Set(cities.slice(1).map(c => c.name))
        return readTimetable().filter(e => connected.has(e.name)).map(e => ({
            name: e.name, gate: e.gate, loopNumber: e.loopNumber, time: timeString(e.minuteOfDay),
            hour: Math.floor(e.minuteOfDay / 60), minute: e.minuteOfDay % 60,
        }))
    }

    function getActiveMessages(schedule, dayMs, nowMs) {
        const msgs = []
        schedule.forEach(entry => {
            const diff = minutesUntil(entry, dayMs, nowMs)
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
        // readSchedule never throws, so an unreadable schedule can't freeze the announcements.
        // Tomorrow's board and yesterday's are read too: late in the evening the loops leaving or arriving just after
        // midnight were never announced (the ticker sat on its idle messages), and a loop that landed at 23:58 lost its
        // "has arrived" notice at midnight.
        const nowMs = Date.now()
        const tomorrowMs = shiftDays(nowMs, 1), yesterdayMs = shiftDays(nowMs, -1)
        const msgs = [
            ...getActiveMessages(readSchedule(departuresKey(nowMs)), nowMs, nowMs),
            ...getActiveMessages(tomorrowsDepartures(tomorrowMs), tomorrowMs, nowMs),
        ]
        // Loops that have just come in, or are about to
        const arrivals = [[yesterdayMs], [nowMs], [tomorrowMs]].flatMap(([dayMs]) => readSchedule(arrivalsKey(dayMs)).map(entry => ({ entry, dayMs })))
        const connectedNames = new Set((purchasedCitiesRef.current || []).map(c => c.name))
        arrivals.filter(({ entry }) => connectedNames.has(entry.name)).forEach(({ entry, dayMs }) => {
            const diff = minutesUntil(entry, dayMs, nowMs)
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