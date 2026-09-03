export const EVENTS = [
    // Positive passive income
    {
        id: 'influencer_praise',
        type: 'positive',
        title: '📱 Going Viral',
        description: 'A travel influencer with 4 million followers just posted a glowing review of your terminal. Passenger bookings are surging.',
        effect: { target: 'passive', multiplier: 2 },
        duration: () => Math.floor(Math.random() * 150 + 30),
    },
    {
        id: 'celebrity_spotted',
        type: 'positive',
        title: '⭐ Celebrity Sighting',
        description: 'A major celebrity was spotted travelling through your terminal. The media coverage is bringing in curious passengers from across the network.',
        effect: { target: 'passive', multiplier: 2 },
        duration: () => Math.floor(Math.random() * 150 + 30),
    },
    {
        id: 'transport_award',
        type: 'positive',
        title: '🏆 Award Won',
        description: 'Your terminal has been named Best Hyperloop Terminal of the Year by the Global Transit Authority. Bookings are at an all-time high.',
        effect: { target: 'passive', multiplier: 3 },
        duration: () => Math.floor(Math.random() * 150 + 30),
    },
    {
        id: 'record_passengers',
        type: 'positive',
        title: '🎉 Record Passenger Day',
        description: 'Today is shaping up to be the busiest day in your terminal\'s history. Every route is fully booked and revenue is flowing.',
        effect: { target: 'passive', multiplier: 2 },
        duration: () => Math.floor(Math.random() * 150 + 30),
    },
    {
        id: 'news_feature',
        type: 'positive',
        title: '📺 Featured on National News',
        description: 'A prime-time news segment just featured your terminal as a beacon of modern transport innovation. Passenger interest is through the roof.',
        effect: { target: 'passive', multiplier: 3 },
        duration: () => Math.floor(Math.random() * 150 + 30),
    },
    {
        id: 'tourism_boost',
        type: 'positive',
        title: '✈️ Tourism Surge',
        description: 'A major international sporting event is driving huge numbers of tourists through your network. Revenue is significantly elevated.',
        effect: { target: 'passive', multiplier: 2 },
        duration: () => Math.floor(Math.random() * 150 + 30),
    },

    // Negative passive income
    {
        id: 'fine',
        type: 'negative',
        title: '⚖️ Regulatory Fine',
        description: 'Your terminal has been fined by the transport authority following a routine inspection. Passenger confidence has temporarily dipped.',
        effect: { target: 'passive', multiplier: 0.5 },
        duration: () => Math.floor(Math.random() * 150 + 30),
    },
    {
        id: 'influencer_criticism',
        type: 'negative',
        title: '😤 Influencer Backlash',
        description: 'A famous travel influencer has publicly criticised your terminal\'s security procedures. Booking numbers have temporarily dropped.',
        effect: { target: 'passive', multiplier: 0.5 },
        duration: () => Math.floor(Math.random() * 150 + 30),
    },
    {
        id: 'bad_weather',
        type: 'negative',
        title: '🌩️ Severe Weather',
        description: 'Extreme weather conditions are causing disruption across your hyperloop network. Passengers are demanding refunds.',
        effect: { target: 'passive', multiplier: 0.33 },
        duration: () => Math.floor(Math.random() * 150 + 30),
    },
    {
        id: 'security_breach',
        type: 'negative',
        title: '🔒 Security Incident',
        description: 'A security incident at your terminal has made national headlines. Passenger numbers have fallen sharply while confidence is restored.',
        effect: { target: 'passive', multiplier: 0.33 },
        duration: () => Math.floor(Math.random() * 150 + 30),
    },
    {
        id: 'staff_strike',
        type: 'negative',
        title: '✊ Staff Walkout',
        description: 'A portion of your staff have walked off the job over pay disputes. Operations are running at reduced capacity.',
        effect: { target: 'passive', multiplier: 0.5 },
        duration: () => Math.floor(Math.random() * 150 + 30),
    },
    {
        id: 'negative_review',
        type: 'negative',
        title: '📰 Scathing Press Coverage',
        description: 'A major newspaper has published a damning exposé on the state of your terminal facilities. Revenue has taken a short-term hit.',
        effect: { target: 'passive', multiplier: 0.5 },
        duration: () => Math.floor(Math.random() * 150 + 30),
    },

    // Positive work
    {
        id: 'bonus_scheme',
        type: 'positive',
        title: '💼 Staff Bonus Scheme',
        description: 'You\'ve introduced a new performance bonus for staff. Productivity is at an all-time high and every work action is generating more revenue.',
        effect: { target: 'work', multiplier: 2 },
        duration: () => Math.floor(Math.random() * 40 + 20),
    },
    {
        id: 'high_productivity',
        type: 'positive',
        title: '⚡ High Productivity Day',
        description: 'Everything is clicking today. Staff morale is high, systems are running perfectly and every work action is producing exceptional results.',
        effect: { target: 'work', multiplier: 3 },
        duration: () => Math.floor(Math.random() * 40 + 20),
    },
    {
        id: 'motivational_speaker',
        type: 'positive',
        title: '🎤 Motivational Speaker',
        description: 'A renowned business coach has given an inspiring talk to your team. Work productivity is significantly boosted.',
        effect: { target: 'work', multiplier: 2 },
        duration: () => Math.floor(Math.random() * 40 + 20),
    },

    // Negative work
    {
        id: 'staff_illness',
        type: 'negative',
        title: '🤒 Staff Illness Outbreak',
        description: 'A nasty bug is sweeping through your workforce. Reduced staffing levels mean every work action is producing less than usual.',
        effect: { target: 'work', multiplier: 0.5 },
        duration: () => Math.floor(Math.random() * 40 + 20),
    },
    {
        id: 'system_maintenance',
        type: 'negative',
        title: '🔧 Emergency Maintenance',
        description: 'Critical systems have gone offline for emergency maintenance. Manual operations are significantly less efficient than normal.',
        effect: { target: 'work', multiplier: 0.5 },
        duration: () => Math.floor(Math.random() * 40 + 20),
    },
    {
        id: 'training_day',
        type: 'negative',
        title: '📋 Mandatory Training Day',
        description: 'All staff are required to attend mandatory compliance training. Productivity has taken a temporary hit while the team is occupied.',
        effect: { target: 'work', multiplier: 0.33 },
        duration: () => Math.floor(Math.random() * 40 + 20),
    },
]

export function getRandomEvent(isPositiveOnly = false) {
    const pool = isPositiveOnly ? EVENTS.filter(e => e.type === 'positive') : EVENTS
    return pool[Math.floor(Math.random() * pool.length)]
}