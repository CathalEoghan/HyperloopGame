import { playClickSound2, playHoverSound } from '../utils/sound.js'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'
import rocketIcon from '../assets/misc/rocket.png'
import portfolioIcon from '../assets/misc/portfolio.png'
import progressIcon from '../assets/misc/progress.png'
import cityIcon from '../assets/misc/city.png'
import constructionIcon from '../assets/misc/construction.png'
import increaseIcon from '../assets/misc/increase.png'
import welcomeIcon from '../assets/misc/welcome.png'
import delayIcon from '../assets/misc/delay.png'
import reputationIcon from '../assets/misc/reputation.png'
import sleepIcon from '../assets/misc/sleep.png'
import successIcon from '../assets/misc/success.png'
import graduationIcon from '../assets/misc/graduation.png'
import eventIcon from '../assets/misc/event.png'
import guideIcon from '../assets/misc/guide.png'
import { withCashIcon } from '../utils/cashText.js'
import './GuideModal.css'

const GUIDE_SECTIONS = [
    { icon: rocketIcon, title: 'Getting Started', content: 'Name your terminal and choose your home city. Your home city determines which country receives local transport bonuses from certain upgrades.' },
    { icon: portfolioIcon, title: 'Working', content: 'Tap the Work button at the top of the screen to earn cash. A tap earns at least £250, and more as you connect cities and build developments (boosts do not raise it, but Work events do while they last). Each Work upgrade adds +45%. There is a rare chance to earn +5 Reputation from working.' },
    { icon: progressIcon, title: 'Ranking Up', content: 'As you earn cash, your XP increases and you rank up. Every rank up offers you 3 random new cities and you choose one to connect to your network. You can re-roll the choices for 15 Reputation.' },
    { icon: cityIcon, title: 'Connecting Cities', content: 'Go to the Cities tab to connect unlocked cities. Each city earns income by the hour, based on its tier and population, but only while it has a scheduled departure: set them up on the Departure Board (Schedule loop, or Automate schedule). Tier 3 cities earn significantly more than Tier 1. Connecting a city also unlocks its unique development or upgrade.' },
    { icon: constructionIcon, title: 'Developments', content: 'Visit the Development tab to build developments in your terminal. Each earns income by the hour, scaled by how busy your terminal is right now - a departure counts from 3 hours before it leaves, an arrival for an hour after it lands, and a loop mid-flight counts for nothing - and can be upgraded up to 10 times for up to a 450% income boost. Upgrades modify your entire network — from boosting city income to reducing delay costs.' },
    { icon: increaseIcon, title: 'How Boosts Stack', content: 'Upgrade boosts shown as + (like +20% city income) are added together: +20% and +30% make +50%, not x1.56. Prestige perks shown as x (like x2) and the Founders\' Hall then multiply that total, so they keep their full strength however many upgrades you own. Hover over the orange percentage next to a city\'s or development\'s income to see the full breakdown.' },
    { icon: welcomeIcon, title: 'Farewells & Greetings', content: 'Check the Terminal Board regularly. When a departure is approaching, a farewell window opens — give a personal farewell to earn +5 Reputation. When a loop arrives, greet its passengers for the same reward. Certain upgrades extend the window or double the reputation earned.' },
    { icon: delayIcon, title: 'Delays', content: 'Occasionally a loop will be delayed. You can compensate passengers (costs cash) or refuse compensation (costs Reputation). Certain upgrades reduce both the compensation cost and reputation penalty.' },
    { icon: reputationIcon, title: 'Reputation', content: 'Reputation is earned by giving farewells, collecting Progress page rewards, from certain upgrades, and rarely through working. It is spent re-rolling city unlocks, refusing delay compensation, upgrading developments and city lines, renaming or removing developments, disconnecting cities, automating the departure schedule, doubling bonuses, buying from the Shop and buying Early Retirement, and finishing a build early (1 Reputation per 5 seconds left, at least 2). Reputation never drops below zero. It also pays out passively: every 2 Reputation you currently hold is worth +1% to city and development income, shown as "Reputation bonus" on both pages - so spending it is a real trade-off, since that bonus drops along with the balance.' },
    { icon: sleepIcon, title: 'Offline Earnings', content: 'Your terminal earns income while you are away, capped at 48 hours by default. Upgrades can extend this cap up to 7 days. Check back regularly to collect your earnings.' },
    { icon: successIcon, title: 'Achievements', content: 'Achievements unlock as you play and are kept for good, even when you retire. Open the trophy button at the bottom right to see them. The Rank 25 milestone upgrade, Anniversary Sales, adds +5% Work earnings for every unique achievement you\'ve unlocked.' },
    { icon: graduationIcon, title: 'Prestige', content: 'At Rank 50, buy Early Retirement (50 Reputation, under Development, Upgrades) and retire from the Prestige tab. Your run resets and you earn Prestige Points, 1 for every 50 ranks reached, plus 1 for every £50M of cash earned this run. Spend them on permanent Prestige upgrades, which are kept in every future run. They come in four layers costing 1, 2, 3 and 5 points; own every upgrade in a layer to open the next.' },
    { icon: eventIcon, title: 'Events', content: 'Random events periodically affect your terminal — positively or negatively. These can multiply your passive income or work earnings for a short time. Building an Event Hall increases your chances of positive events.' },
]

function GuideModal({ onClose }) {
    useEscapeToClose(() => { playClickSound2(); onClose() })
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="guide-modal" onClick={e => e.stopPropagation()}>
                <p className="guide-heading"><img src={guideIcon} alt="" className="guide-heading-icon" />GUIDE</p>
                <div className="guide-body">
                    {GUIDE_SECTIONS.map(section => (
                        <div
                            key={section.title}
                            className="guide-section"
                            onMouseEnter={() => playHoverSound()}
                        >
                            <p className="guide-section-title"><img src={section.icon} alt="" className="guide-section-icon" />{section.title}</p>
                            <p className="guide-section-content">{withCashIcon(section.content)}</p>
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