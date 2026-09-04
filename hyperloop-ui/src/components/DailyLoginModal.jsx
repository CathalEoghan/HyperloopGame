import { playClickSound2, playHoverSound } from '../utils/sound.js'
import reputationIcon from '../assets/misc/reputation.png'
import cashIcon from '../assets/misc/cash.png'
import './DailyLoginModal.css'

function DailyLoginModal({ cashBonus, repBonus, onCollect }) {
    return (
        <div className="modal-overlay">
            <div className="daily-login-modal">
                <p className="daily-login-heading">⚡ DAILY BONUS</p>
                <h2 className="daily-login-title">Welcome back!</h2>
                <p className="daily-login-subtitle">Your terminal has been busy while you were away. Here's your daily reward:</p>

                <div className="daily-login-rewards">
                    <div className="daily-login-reward-row">
                        <img src={cashIcon} alt="cash" className="daily-login-icon" />
                        <span className="daily-login-reward-text">£{cashBonus.toLocaleString()}</span>
                    </div>
                    {repBonus > 0 && (
                        <div className="daily-login-reward-row">
                            <img src={reputationIcon} alt="reputation" className="daily-login-icon" />
                            <span className="daily-login-reward-text">+{repBonus} Reputation</span>
                        </div>
                    )}
                </div>

                {repBonus > 0 && (
                    <p className="daily-login-note">Reputation bonus from Passenger Loyalty Scheme</p>
                )}

                <button
                    className="opening-btn"
                    style={{ border: '2px solid white' }}
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => { playClickSound2(); onCollect() }}
                >
                    Collect
                </button>
            </div>
        </div>
    )
}

export default DailyLoginModal