// Why a loop is late, for the delay popup. About the loop itself, never about the terminal's facilities or the
// conditions outside, so they are true wherever it is. Arrivals are another terminal's loops, so theirs are about the journey.
export const DEPARTURE_DELAY_REASONS = [
    'a routine safety inspection',
    'a late change of cabin crew',
    'a short wait for a free track slot',
    'a final systems check',
    'a late-running connecting service',
    'a pressure recalibration in the tube',
    'a late cargo loading',
    'a software update on the loop',
    'a wait for the previous loop to clear the track',
    'a cabin reset between services',
]
export const ARRIVAL_DELAY_REASONS = [
    'a routine safety inspection on the way',
    'a short hold for a free track slot',
    'a pressure recalibration in the tube',
    'a late departure from its origin',
    'a signalling check along the route',
    'a reduced speed section on the line',
    'a software update on the loop',
    'a wait for another loop to clear the track',
]
export const pickDelayReason = isArrival => {
    const list = isArrival ? ARRIVAL_DELAY_REASONS : DEPARTURE_DELAY_REASONS
    return list[Math.floor(Math.random() * list.length)]
}
