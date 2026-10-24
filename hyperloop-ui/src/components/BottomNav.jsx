
import {
    playClickSound2,
    playClickSound3,
    playBottomNavbarHoverSound
} from '../utils/sound.js'

import './BottomNav.css'

function BottomNav({ activeTab, onSelect }) {
    const targetCities = activeTab === "Cities" ? "Home" : "Cities"
    const targetDevelopment = activeTab === "Development" ? "Home" : "Development"
    const targetProgress = activeTab === "Progress" ? "Home" : "Progress"
    const targetPrestige = activeTab === "Prestige" ? "Home" : "Prestige"
    const targetSettings = activeTab === "Settings" ? "Home" : "Settings"

    const handleClick = (currentTab, target) => {
        if (activeTab === currentTab) {
            playClickSound3()
        } else {
            playClickSound2()
        }

        onSelect(target)
    }

    return (
        <div className="bottomNav">
            <button
                className={`Cities ${activeTab === "Cities" ? "active" : ""}`}
                aria-current={activeTab === "Cities" ? "page" : undefined}
                onMouseEnter={playBottomNavbarHoverSound}
                onClick={() => handleClick("Cities", targetCities)}
            >
                Cities
            </button>

            <button
                className={`Development ${activeTab === "Development" ? "active" : ""}`}
                aria-current={activeTab === "Development" ? "page" : undefined}
                onMouseEnter={playBottomNavbarHoverSound}
                onClick={() => handleClick("Development", targetDevelopment)}
            >
                Development
            </button>

            <button
                className={`Progress ${activeTab === "Progress" ? "active" : ""}`}
                aria-current={activeTab === "Progress" ? "page" : undefined}
                onMouseEnter={playBottomNavbarHoverSound}
                onClick={() => handleClick("Progress", targetProgress)}
            >
                Progress
            </button>

            <button
                className={`Prestige ${activeTab === "Prestige" ? "active" : ""}`}
                aria-current={activeTab === "Prestige" ? "page" : undefined}
                onMouseEnter={playBottomNavbarHoverSound}
                onClick={() => handleClick("Prestige", targetPrestige)}
            >
                Prestige
            </button>

            <button
                className={`Settings ${activeTab === "Settings" ? "active" : ""}`}
                aria-current={activeTab === "Settings" ? "page" : undefined}
                onMouseEnter={playBottomNavbarHoverSound}
                onClick={() => handleClick("Settings", targetSettings)}
            >
                Settings
            </button>
        </div>
    )
}

export default BottomNav
