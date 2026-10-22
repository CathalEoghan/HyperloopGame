import { playClickSound2, playHoverSound } from '../utils/sound.js'
import officialLogo from '../assets/misc/officialLogo.png'
import portfolioIcon from '../assets/misc/portfolio.png'
import growthIcon from '../assets/misc/growth.png'
import planetEarthIcon from '../assets/misc/planet-earth.png'
import constructionIcon from '../assets/misc/construction.png'
import './OnboardingModal.css'

function OnboardingModal({ onDismiss }) {
    return (
        <div className="modal-overlay">
            <div className="modal onboarding-modal">
                <div className="onboarding-logo"><img src={officialLogo} alt="Hyperloop Empire" /></div>
                <h2 className="onboarding-title">Welcome!</h2>
                <p className="onboarding-intro">
                    You're now the manager of the world's first <strong>hyperloop terminal</strong>.
                    Here's how to get started:
                </p>
                <div className="onboarding-steps">
                    <div className="onboarding-step">
                        {/* The generic ".modal img" rule (CitiesPage.css/DevelopmentPage.css) stretches and
                            borders any plain <img> inside a ".modal" - these icons opt out with inline styles,
                            the same way the cash/reputation icons elsewhere in the app do. */}
                        <img className="onboarding-step-icon" src={portfolioIcon} alt="" style={{ width: '26px', height: '26px', objectFit: 'contain', border: 'none' }} />
                        <div>
                            <strong>Tap Work</strong> at the top of the screen to earn cash and XP.
                        </div>
                    </div>
                    <div className="onboarding-step">
                        <img className="onboarding-step-icon" src={growthIcon} alt="" style={{ width: '26px', height: '26px', objectFit: 'contain', border: 'none' }} />
                        <div>
                            <strong>Rank up</strong> to unlock new cities for your network.
                        </div>
                    </div>
                    <div className="onboarding-step">
                        <img className="onboarding-step-icon" src={planetEarthIcon} alt="" style={{ width: '26px', height: '26px', objectFit: 'contain', border: 'none' }} />
                        <div>
                            <strong>Connect cities</strong> to earn daily income and grow your empire.
                        </div>
                    </div>
                    <div className="onboarding-step">
                        <img className="onboarding-step-icon" src={constructionIcon} alt="" style={{ width: '26px', height: '26px', objectFit: 'contain', border: 'none' }} />
                        <div>
                            <strong>Build developments</strong> in your terminal to boost revenue.
                        </div>
                    </div>
                </div>
                <p className="onboarding-hint">Start by tapping the <strong>Work</strong> button.</p>
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