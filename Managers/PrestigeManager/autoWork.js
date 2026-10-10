// Best P.A. Ever: the Work button clicks itself once every 500 ms.
export const AUTO_WORK_INTERVAL_MS = 500
// A tab in the background is slowed by the browser to one tick a second, or one a minute after a while. The
// clicks it missed are made up, but never more than this many at once, so a long sleep can't pay out for hours.
export const AUTO_WORK_MAX_CATCHUP = 150

// How many auto-clicks are due now, and where the "last click" clock moves to afterwards.
// Moving the clock by whole clicks (not to `now`) keeps the long-run rate at exactly one per interval.
export function workClicksDue(now, lastClickAt, interval = AUTO_WORK_INTERVAL_MS, maxCatchup = AUTO_WORK_MAX_CATCHUP) {
    const due = Math.floor(Math.max(0, now - lastClickAt) / interval)
    if (due <= 0) return { clicks: 0, lastClickAt }
    if (due > maxCatchup) return { clicks: maxCatchup, lastClickAt: now }
    return { clicks: due, lastClickAt: lastClickAt + due * interval }
}
