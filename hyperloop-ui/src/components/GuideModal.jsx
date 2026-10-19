import { playClickSound2, playHoverSound } from '../utils/sound.js'
import './GuideModal.css'

const GUIDE_SECTIONS = [
    { title: '⚡ Getting Started', content: 'Name your terminal and choose your home city. Your home city determines which country receives local transport bonuses from certain upgrades.' },
    { title: '💼 Working', content: 'Tap the Work button at the top of the screen to earn cash. A tap earns at least £250, and more as you connect cities and build developments (boosts do not raise it, but Work events do while they last). Each Work upgrade adds +45%. There is a rare chance to earn +5 Reputation from working.' },
    { title: '⬆️ Ranking Up', content: 'As you earn cash, your XP increases and you rank up. Every rank up offers you 3 random new cities and you choose one to connect to your network. You can re-roll the choices for 15 Reputation.' },
    { title: '🌍 Connecting Cities', content: 'Go to the Cities tab to connect unlocked cities. Each city earns daily income based on its tier and population. Tier 3 cities earn significantly more than Tier 1. Connecting a city also unlocks its unique development or upgrade.' },
    { title: '🏗️ Developments', content: 'Visit the Development tab to build developments in your terminal. Each earns daily income and can be upgraded up to 3 times for up to 100% income boost. Upgrades modify your entire network — from boosting city income to reducing delay costs.' },
    { title: '📈 How Boosts Stack', content: 'Upgrade boosts shown as + (like +20% city income) are added together: +20% and +30% make +50%, not x1.56. Prestige perks shown as x (like x2) and the Founders\' Hall then multiply that total, so they keep their full strength however many upgrades you own. Hover over the orange percentage next to a city\'s or development\'s income to see the full breakdown.' },
    { title: '✈️ Farewells & Greetings', content: 'Check the Terminal Board regularly. When a departure is approaching, a farewell window opens — give a personal farewell to earn +5 Reputation. When a loop arrives, greet its passengers for the same reward. Certain upgrades extend the window or double the reputation earned.' },
    { title: '⏱️ Delays', content: 'Occasionally a loop will be delayed. You can compensate passengers (costs cash) or refuse compensation (costs Reputation). Certain upgrades reduce both the compensation cost and reputation penalty.' },
    { title: '🏆 Reputation', content: 'Reputation is earned by giving farewells, collecting Progress page rewards, from certain upgrades, and rarely through working. It is spent re-rolling city unlocks, refusing delay compensation, upgrading developments, disconnecting cities and doubling bonuses, and finishing a build early (1 Reputation per 5 seconds left, at least 2). Reputation never drops below zero.' },
    { title: '💤 Offline Earnings', content: 'Your terminal earns income while you are away, capped at 48 hours by default. Upgrades can extend this cap up to 7 days. Check back regularly to collect your earnings.' },
    { title: '🏅 Achievements', content: 'Achievements unlock as you play and are kept for good, even when you retire. Open the trophy button at the bottom right to see them. Some Rank milestone upgrades and Prestige upgrades grow with the number you have unlocked.' },
    { title: '🎓 Prestige', content: 'At Rank 50, buy Early Retirement (250 Reputation, under Development, Upgrades) and retire from the Prestige tab. Your run resets and you earn Prestige Points, 1 for every 50 ranks reached. Spend them on permanent Prestige upgrades, which are kept in every future run. They come in four layers costing 1, 2, 3 and 5 points; own every upgrade in a layer to open the next.' },
    { title: '⚡ Events', content: 'Random events periodically affect your terminal — positively or negatively. These can multiply your passive income or work earnings for a short time. Building an Event Hall increases your chances of positive events.' },
]

function GuideModal({ onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="guide-modal" onClick={e => e.stopPropagation()}>
                <p className="guide-heading">📖 GUIDE</p>
                <div className="guide-body">
                    {GUIDE_SECTIONS.map(section => (
                        <div
                            key={section.title}
                            className="guide-section"
                            onMouseEnter={() => playHoverSound()}
                        >
                            <p className="guide-section-title">{section.title}</p>
                            <p className="guide-section-content">{section.content}</p>
                        </div>
                    ))}
                </div>
                <button
                    className="closeButton"
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => { playClickSound2(); onClose() }}
                >
                    Close
                </button>
            </div>
        </div>
    )
}

export default GuideModal