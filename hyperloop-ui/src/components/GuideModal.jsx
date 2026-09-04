import { playClickSound2 } from '../utils/sound.js'
import './GuideModal.css'

const GUIDE_SECTIONS = [
    { title: '⚡ Getting Started', content: 'Name your terminal and choose your home city. Your home city determines which country receives local transport bonuses from certain upgrades.' },
    { title: '💼 Working', content: 'Tap the Work button at the top of the screen to earn cash. Each tap earns £100 by default — upgrades can increase this up to £600 per tap. There is a rare chance to earn +5 Reputation from working.' },
    { title: '⬆️ Ranking Up', content: 'As you earn cash, your XP increases and you rank up. Every rank up unlocks a new city you can connect to your network. You can re-roll an unwanted city unlock for 15 Reputation.' },
    { title: '🌍 Connecting Cities', content: 'Go to the Cities tab to connect unlocked cities. Each city earns daily income based on its tier and population. Tier 3 cities earn significantly more than Tier 1. Connecting a city also unlocks its unique development or upgrade.' },
    { title: '🏗️ Developments', content: 'Visit the Development tab to build developments in your terminal. Each earns daily income and can be upgraded up to 3 times for up to 100% income boost. Upgrades modify your entire network — from boosting city income to reducing delay costs.' },
    { title: '✈️ Farewells', content: 'Check the Departure Board regularly. When a departure is approaching, a farewell window opens — give a personal farewell to earn +5 Reputation. Certain upgrades extend the window or double the reputation earned.' },
    { title: '⏱️ Delays', content: 'Occasionally a flight will be delayed. You can compensate passengers (costs cash) or refuse compensation (costs Reputation). Certain upgrades reduce both the compensation cost and reputation penalty.' },
    { title: '🏆 Reputation', content: 'Reputation is earned by giving farewells, accepting delays gracefully, and rarely through working. It is spent re-rolling city unlocks. Reputation never drops below zero.' },
    { title: '💤 Offline Earnings', content: 'Your terminal earns income while you are away, capped at 48 hours by default. Upgrades can extend this cap up to 7 days. Check back regularly to collect your earnings.' },
    { title: '⚡ Events', content: 'Random events periodically affect your terminal — positively or negatively. These can multiply your passive income or work earnings for a short time. Building an Event Hall increases your chances of positive events.' },
]

function GuideModal({ onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="guide-modal" onClick={e => e.stopPropagation()}>
                <p className="guide-heading">📖 GUIDE</p>
                <div className="guide-body">
                    {GUIDE_SECTIONS.map(section => (
                        <div key={section.title} className="guide-section">
                            <p className="guide-section-title">{section.title}</p>
                            <p className="guide-section-content">{section.content}</p>
                        </div>
                    ))}
                </div>
                <button className="closeButton" onClick={() => { playClickSound2(); onClose() }}>Close</button>
            </div>
        </div>
    )
}

export default GuideModal