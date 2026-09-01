import { playClickSound2, playHoverSound } from '../utils/sound.js'
import './OnboardingModal.css'

function OnboardingModal({ onDismiss }) {
    return (
        <div className="modal-overlay">
            <div className="modal onboarding-modal">
                <div className="onboarding-logo">⚡ HYPERLOOP CENTRAL</div>
                <h2 className="onboarding-title">Welcome!</h2>
                <p className="onboarding-intro">
                    You're now the manager of the world's first <strong>hyperloop terminal</strong>.
                    Here's how to get started:
                </p>
                <div className="onboarding-steps">
                    <div className="onboarding-step">
                        <span className="onboarding-step-icon">💼</span>
                        <div>
                            <strong>Tap Work</strong> at the top of the screen to earn cash and XP.
                        </div>
                    </div>
                    <div className="onboarding-step">
                        <span className="onboarding-step-icon">⬆️</span>
                        <div>
                            <strong>Rank up</strong> to unlock new cities for your network.
                        </div>
                    </div>
                    <div className="onboarding-step">
                        <span className="onboarding-step-icon">🌍</span>
                        <div>
                            <strong>Connect cities</strong> to earn daily income and grow your empire.
                        </div>
                    </div>
                    <div className="onboarding-step">
                        <span className="onboarding-step-icon">🏗️</span>
                        <div>
                            <strong>Build developments</strong> in your terminal to boost revenue.
                        </div>
                    </div>
                </div>
                <p className="onboarding-hint">Start by tapping the <strong>Work</strong> button — your first city unlock is just a few taps away!</p>
                <button
                    className="opening-btn"
                    onMouseEnter={() => playHoverSound()}
                    onClick={() => { playClickSound2(); onDismiss(); }}
                >
                    Let's go →
                </button>
            </div>
        </div>
    )
}

export default OnboardingModal