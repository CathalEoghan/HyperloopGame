
import { playClickSound2 } from '../utils/sound.js'
import { playClickSound3 } from '../utils/sound.js'
import './BottomNav.css'

function BottomNav({activeTab, onSelect}) {

    const targetCities = activeTab === "Cities" ? "Home" : "Cities"
    const targetDevelopment = activeTab === "Development" ? "Home" : "Development"
    const targetProgress = activeTab === "Progress" ? "Home" : "Progress"
    const targetSettings = activeTab === "Settings" ? "Home" : "Settings"

    return (

    <div className="bottomNav">

    <button className="Cities" onClick={() => {
        if (activeTab == "Cities") {
            playClickSound3();
        } else {
        playClickSound2();
        }
        onSelect(targetCities)}}>
        Cities
    </button>

     <button className="Development" onClick={() => {
        if (activeTab == "Development") {
            playClickSound3();
        } else {
        playClickSound2();
        }
        onSelect(targetDevelopment)}}>
        Development
    </button>

    <button className="Progress" onClick={() => {
        if (activeTab == "Progress") {
            playClickSound3();
        } else {
        playClickSound2();
        }
        onSelect(targetProgress)}}>
        Progress
    </button>

    <button className="Settings" onClick={() => {
        if (activeTab == "Settings") {
            playClickSound3();
        } else {
        playClickSound2();
        }
        onSelect(targetSettings)}}>
        Settings
    </button>

    </div>

    )

}

export default BottomNav