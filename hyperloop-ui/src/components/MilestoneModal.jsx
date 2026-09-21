import { useEffect } from 'react'
import { playClickSound2, playRankUpSound, playHoverSound } from '../utils/sound.js'
import fireworksIcon from '../assets/misc/fireworks.png'
import './MilestoneModal.css'

function MilestoneModal({ milestone, onContinue }) {
    useEffect(() => {
        playRankUpSound()
    }, [])

    return (
        <div className="modal-overlay">
            <div className="milestone-modal">
                <p className="milestone-rank-label">RANK {milestone.rank}</p>
                <img src={fireworksIcon} alt="milestone" style={{ width: '56px', height: '56px', border: 'none', borderRadius: '0' }} />
                <h2 className="milestone-heading">Milestone Reached!</h2>
                <p className="milestone-message">
                    Congratulations on reaching Rank {milestone.rank}! You've unlocked a special development for your terminal.
                </p>
                <div className="milestone-reward-box">
                    <span className="milestone-reward-label">Special Unlock</span>
                    <span className="milestone-reward-name">{milestone.upgradeName}</span>
                </div>
                <button
                    className="closeButton"
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => { playClickSound2(); onContinue(); }}
                >
                    Claim Reward
                </button>
            </div>
        </div>
    )
}

export default MilestoneModal