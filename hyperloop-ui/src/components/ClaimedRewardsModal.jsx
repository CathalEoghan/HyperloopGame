import { useEscapeToClose } from '../utils/useEscapeToClose.js'
import cashIcon from '../assets/misc/cash.png'
import reputationIcon from '../assets/misc/reputation.png'
import { playClickSound2, playHoverSound } from '../utils/sound.js'
import './RankUpModal.css'
import './ClaimedCitiesModal.css'
import './ClaimedRewardsModal.css'

// Shown after "Claim all" on the Progress page: what the whole batch paid, in one popup instead of a "+£" floating up
// from every card. summary: { cash, rep, count, label } - the totals, how many rewards, and which section they were from.
function ClaimedRewardsModal({ summary, onClose }) {
    // Escape = Accept: the rewards are already paid, this only reports them
    useEscapeToClose(() => { playClickSound2(); onClose() })
    const { cash, rep, count, label } = summary
    return (
        <div className="modal-overlay">
            <div className="modal claimed-modal claimed-rewards-modal" role="dialog" aria-label="Rewards collected">
                <h2 className="reveal-heading"><strong>You've collected {count} {count === 1 ? 'reward' : 'rewards'}!</strong></h2>
                <p className="claimed-rewards-sub">From your {label}</p>
                <div className="claimed-rewards-totals">
                    {cash > 0 && (
                        <div className="claimed-rewards-line">
                            <img src={cashIcon} alt="£" />
                            <span>+{cash.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</span>
                        </div>
                    )}
                    {rep > 0 && (
                        <div className="claimed-rewards-line claimed-rewards-rep">
                            <img src={reputationIcon} alt="Reputation" />
                            <span>+{rep.toLocaleString('en-GB')} Reputation</span>
                        </div>
                    )}
                </div>
                <button onMouseEnter={() => playHoverSound()} onClick={() => { playClickSound2(); onClose() }}>Accept</button>
            </div>
        </div>
    )
}

export default ClaimedRewardsModal
