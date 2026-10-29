// The single source of truth for the game's version history. VERSION_LOG[0] is always the current
// version - both the Settings page's Update History drop-down and the Loading screen's version tag
// read from here, so the two can never drift out of sync with each other.
export const VERSION_LOG = [
    {
        version: 'v.4.0',
        label: 'Economy & Shop Update',
        major: true,
        date: 'October 2026',
        notes: [
            'Economy overhaul - departing loops now need to be scheduled, with ticket sales dependent on time of day',
            'Development income now closely follows how many loops are departing soon or have just arrived',
            'Added the shop with 14 starting bundles',
            'Added new maximum-quality globe texture',
            'Added new Prestige upgrades',
            'Added new cities and developments',
            'Economy balancing changes',
            'Countless bug fixes, QoL updates and UI changes for a more fun overall experience',
        ]
    },

    {
        version: 'v.3.0',
        label: 'Prestige & Achievements',
        major: true,
        date: 'October 2026',
        notes: [
            'Prestige: at Rank 50, buy Early Retirement (250 Reputation) and retire from the new Prestige tab to earn Prestige Points',
            '30 permanent Prestige upgrades in four layers, kept in every future run',
            '51 achievements, kept for good, with a trophy button on the home screen',
            '"Claim all" buttons for waiting rank-ups and development reveals',
            'Work is now worth about 10 seconds of base income per click, and income has been rebalanced',
            'VIP passengers, worth five times the Reputation at farewells',
            'Hyper-Link can be muted',
            'Country flags are now bundled with the game, so they appear straight away instead of loading in one by one',
            'Spend Reputation to build a city or development instantly: 1 Reputation per 5 seconds left, at least 2',
            'Income boost breakdowns now show the upgrades added together, then the Prestige perks and Founders\' Hall that multiply them, and the Guide explains how boosts stack',
            'Many bug fixes and text corrections',
        ]
    },

    {
        version: 'v2.1',
        label: 'Bug Fixes & UI Polish',
        date: 'October 2026',
        notes: [
            'The Founders\' Hall bonus is now included in the income shown for each city and development',
            'Fixed big number formatting, removed the treasury cap, and numbers now look the same on every screen',
            'Corrected text that contradicted the mechanics: Duty-Free, the +2.5% upgrades, the Guide, loop delays and the construction screen',
            'The globe now works on touchscreens: drag to spin, pinch to zoom, tap to select',
            'The globe and the Hyper-Link phone button are now switched off while a popup is open',
            'Double-clicking Claim City no longer skips a reveal',
            'Connecting a city you cannot afford no longer plays the construction sound',
            'Daily login and offline double bonuses now use your current Reputation and cannot be charged twice',
            'Event countdowns now follow the real time left, with no more stale timers',
            'Seasons now work correctly for every home city',
            'Fixed the midnight departure bug, the Sleeping tab, and cities that were not unlocked appearing unlockable',
            'Developments are no longer removed if their city disconnects while they are under construction',
            'Import and save fixes, with safeguards around outside asset imports',
            'Hyper-Link now has over 500 posts, new surnames and more official terminal posts, with fresher post styles and photos shown first',
            'More Work flavour text',
            'The Owned only button now fills gold and plays a sound on hover',
            'The Departure Board only shows a scrollbar when the list is longer than the window',
            'Update history added to Settings as a drop-down',
        ]
    },
    {
    version: 'v2.0',
    label: 'Hyper-Link Social Media',
    major: true,
    date: 'September 2026',
    notes: [
        'Introduced Hyper-Link — a fully simulated in-game social media platform',
        'Posts generate dynamically every 1–3 minutes based on game context',
        'Over 300 unique posts across 50+ categories including time of day, day of week, departures, delays, developments, events and more',
        'Official terminal account posts announcements, event responses and delay updates in real time',
        'Double-tap or click ❤ to like posts — counts grow dynamically over time',
        'Profile pictures drawn from a pool of 300 real photographs',
        'Departure board converted to a floating modal above the globe',
        'Split-flap animation and sound can now be toggled in Settings',
        'Development and city page scrollbars fixed — no longer overlap the ticker bar',
        'Cloudinary images now preloaded before reveal modals open',
        'Hyper-Link feed auto-cleans posts older than 2 days',
        '5 new cities: Ibiza, Jeddah, Jeju City, Memphis, Rhodes',
    ]
},
    {
        version: 'v1.2',
        label: 'Bug Fixes & Polish',
        date: 'September 2026',
        notes: [
            'Development build-cost discounts now correctly applied at point of purchase',
            'Development upgrade-cost discounts now correctly applied at point of upgrade',
            'Guaranteed-tier city reroll now picks randomly from all eligible cities',
            'Home city displayed beneath terminal name in top banner',
            'Clicking owned city flags on globe opens city info modal',
            'Rank/Level terminology unified to Rank throughout',
            'Upgrade confirmation now plays distinct sound',
            'Farewell modal background matches departure board styling',
            'isSouthern flag corrected for Astana, Nairobi and Kigali',
            'Christchurch re-tiered to match its population',
            'City tiers standardised: Tier 1 under 1M, Tier 2 1M–10M, Tier 3 over 10M',
            'Intro audio now respects sound settings',
        ]
    },
    {
        version: 'v1.1',
        label: 'Economy & Polish',
        date: 'September 2026',
        notes: [
            'Linear economy system — all bonuses now stack additively',
            'Seasonal and monthly boosts now apply correctly to the current season/month only',
            'Time of day, business week and weekend boosts now apply to developments',
            'Easter bonus now calculated algorithmically',
            'City and development income tooltips showing full boost breakdown',
            'Progress page overhauled with full active bonus tracking',
            'Events system fully wired up — tint, indicator and modal now in sync',
            'Departure board now generates on startup, not just when opened',
            'Home city developments no longer appear in the reveal queue',
            'Farewell countdown now uses actual remaining time',
            'Accent-insensitive city and country search',
            'Balance and reputation flash red on decrease',
            'Version log added to settings',
        ]
    },
    {
        version: 'v1.0',
        label: 'Initial Release',
        major: true,
        date: 'September 2026',
        notes: [
            '335 cities across 150 countries to collect',
            'Real-time economy with 181 developments and 157 upgrades',
            'Departure board with farewell mechanic',
            'Rank progression and city unlock system',
            'Random events system',
            'Offline earnings and full save/export support',
            'Secret city 👀',
        ]
    }
]
