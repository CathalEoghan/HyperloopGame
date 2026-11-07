import { useEffect, useRef, useState } from 'react'

// Tells the player when something needs them while the game is in a background tab: departures to see off,
// arrivals to greet, delays, events and rank-ups all expire or wait on a decision, and none of them can be seen
// from another tab.
//
//  - The tab title always shows how many things are waiting, e.g. "(2) Final call - Hyperloop Empire".
//  - A browser notification for each new one is opt-in (Settings > Alerts), because it needs the browser's
//    permission. It is shown by the browser on this device; nothing is sent anywhere.

export const NOTIFY_KEY = 'hyperloop_notifications'

export const notificationsSupported = () => typeof Notification !== 'undefined'
// On only when the player chose it AND the browser still allows it (permission can be revoked in the site settings)
export const notificationsEnabled = () =>
    notificationsSupported() && Notification.permission === 'granted' && localStorage.getItem(NOTIFY_KEY) === 'true'

// Resolves to 'granted', 'denied', 'default' (the prompt was dismissed) or 'unsupported'
export async function enableNotifications() {
    if (!notificationsSupported()) return 'unsupported'
    let permission = Notification.permission
    if (permission === 'default') {
        try { permission = await Notification.requestPermission() } catch { return 'denied' }
    }
    if (permission === 'granted') localStorage.setItem(NOTIFY_KEY, 'true')
    return permission
}
export function disableNotifications() {
    localStorage.setItem(NOTIFY_KEY, 'false')
}

function showNotification(item) {
    try {
        // tag: the same thing can only ever be on screen once
        const n = new Notification(item.title, { body: item.body, tag: item.key })
        n.onclick = () => { window.focus(); n.close() }
    } catch { /* some browsers refuse the constructor (e.g. certain mobile ones) - the tab title still works */ }
}

// items: [{ key, title, body }] for everything waiting right now, most important first. `key` must be unique per
// thing (and change when it's a new one), since it decides what has already been announced.
export function useAttentionAlerts(items) {
    const [hidden, setHidden] = useState(() => document.hidden)
    const [baseTitle] = useState(() => document.title)
    const announced = useRef(new Set())

    useEffect(() => {
        const onChange = () => setHidden(document.hidden)
        document.addEventListener('visibilitychange', onChange)
        return () => document.removeEventListener('visibilitychange', onChange)
    }, [])

    const count = items.length
    const firstTitle = items[0]?.title
    useEffect(() => {
        document.title = hidden && count > 0 ? `(${count}) ${firstTitle} - ${baseTitle}` : baseTitle
        return () => { document.title = baseTitle }
    }, [hidden, count, firstTitle, baseTitle])

    const keys = items.map(item => item.key).join('|')
    useEffect(() => {
        const present = new Set(keys ? keys.split('|') : [])
        announced.current.forEach(key => { if (!present.has(key)) announced.current.delete(key) })
        // Whatever is waiting while the tab is in front has been seen, so it isn't announced again on leaving
        if (!hidden) { present.forEach(key => announced.current.add(key)); return }
        if (!notificationsEnabled()) return
        items.forEach(item => {
            if (announced.current.has(item.key)) return
            announced.current.add(item.key)
            showNotification(item)
        })
        // items is rebuilt every render; keys is what says whether anything in it actually changed
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hidden, keys])
}
