import { useEffect } from 'react'
import { playClickSound2, playDevelopmentMilestoneSound, playHoverSound } from '../utils/sound.js'
import foodIcon from '../assets/misc/foodCategory.png'
import shoppingIcon from '../assets/misc/shoppingCategory.png'
import recreationIcon from '../assets/misc/recreationCategory.png'
import serviceIcon from '../assets/misc/serviceCategory.png'
import reputationIcon from '../assets/misc/reputation.png'
import { milestoneTier, nextMilestoneCount } from '../data/developmentMilestones.js'
import './MilestoneModal.css'
import { useEscapeToClose } from '../utils/useEscapeToClose.js'

const CATEGORY_ICONS = { Food: foodIcon, Shopping: shoppingIcon, Recreation: recreationIcon, Service: serviceIcon }

// Shown when the number of developments built in a category reaches one of its milestones. The Reputation is already in
// the save by the time this shows (App.jsx holds it back from the counter); the button is what makes it land.
// `milestone` is { category, count, reputation }: count is the tier reached, and reputation covers every tier passed at
// once (building a dozen in one go can cross several).
function DevelopmentMilestoneModal({ milestone, onContinue }) {
    // A notice, so Escape does what its button does
    useEscapeToClose(() => { playClickSound2(); onContinue() })
    useEffect(() => { playDevelopmentMilestoneSound() }, [])

    const { category, count, reputation } = milestone
    const next = nextMilestoneCount(category, count)
    const heading = count === 1
        ? `You've built your first ${category} development!`
        : `You've built ${count} ${category} developments!`

    return (
        <div className="modal-overlay">
            <div className="milestone-modal" role="dialog" aria-label={heading}>
                <p className="milestone-rank-label">{category.toUpperCase()} MILESTONE</p>
                <img src={CATEGORY_ICONS[category]} alt="" style={{ width: '72px', height: '72px', objectFit: 'contain', border: 'none', borderRadius: '0' }} />
                <h2 className="milestone-heading">{heading}</h2>
                <p className="milestone-message">{milestoneTier(category, count)?.text}</p>
                <div className="milestone-reward-box">
                    <span className="milestone-reward-label">Reputation Reward</span>
                    <span className="milestone-reward-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <img src={reputationIcon} alt="" style={{ width: '20px', height: '20px', border: 'none', borderRadius: '0' }} />+{reputation}
                    </span>
                </div>
                {next
                    ? <p className="milestone-next">Next {category} milestone at {next} {category} developments built</p>
                    : <p className="milestone-next">That was the last {category} milestone. Well done!</p>}
                <button
                    className="closeButton"
                    autoFocus
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => { playClickSound2(); onContinue() }}
                >
                    Claim Reward
                </button>
            </div>
        </div>
    )
}

export default DevelopmentMilestoneModal
