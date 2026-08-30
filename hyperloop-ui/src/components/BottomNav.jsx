
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
            playClickSound2();
        } else {
        playClickSound3();
        }
        onSelect(targetCities)}}>
        Cities
    </button>

     <button className="Development" onClick={() => {
        if (activeTab == "Development") {
            playClickSound2();
        } else {
        playClickSound3();
        }
        onSelect(targetDevelopment)}}>
        Development
    </button>

    <button className="Progress" onClick={() => {
        if (activeTab == "Progress") {
            playClickSound2();
        } else {
        playClickSound3();
        }
        onSelect(targetProgress)}}>
        Progress
    </button>

    <button className="Settings" onClick={() => {
        if (activeTab == "Settings") {
            playClickSound2();
        } else {
        playClickSound3();
        }
        onSelect(targetSettings)}}>
        Settings
    </button>

    </div>

    )

}

export default BottomNav