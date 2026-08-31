import { playClickSound2, playClickSound3, playBottomNavbarHoverSound } from '../utils/sound.js'
import './BottomNav.css'

function BottomNav({ activeTab, onSelect }) {
    const targetCities = activeTab === "Cities" ? "Home" : "Cities"
    const targetDevelopment = activeTab === "Development" ? "Home" : "Development"
    const targetProgress = activeTab === "Progress" ? "Home" : "Progress"
    const targetSettings = activeTab === "Settings" ? "Home" : "Settings"

    const handleClick = (currentTab, target) => {
        if (activeTab === currentTab) {
            playClickSound3();
        } else {
            playClickSound2();
        }
        onSelect(target);
    }

    return (
        <div className="bottomNav">
            <button className="Cities"
                onMouseEnter={() => playBottomNavbarHoverSound()}
                onClick={() => handleClick("Cities", targetCities)}>
                Cities
            </button>
            <button className="Development"
                onMouseEnter={() => playBottomNavbarHoverSound()}
                onClick={() => handleClick("Development", targetDevelopment)}>
                Development
            </button>
            <button className="Progress"
                onMouseEnter={() => playBottomNavbarHoverSound()}
                onClick={() => handleClick("Progress", targetProgress)}>
                Progress
            </button>
            <button className="Settings"
                onMouseEnter={() => playBottomNavbarHoverSound()}
                onClick={() => handleClick("Settings", targetSettings)}>
                Settings
            </button>
        </div>
    )
}

export default BottomNav