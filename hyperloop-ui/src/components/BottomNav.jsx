
import { playClickSound2 } from '../utils/sound.js'
import { playClickSound3 } from '../utils/sound.js'
import './BottomNav.css'

function BottomNav({activeTab, onSelect}) {

    const target = activeTab === "Cities" ? "Home" : "Cities"

    return (

    <div className="bottomNav">

    <button className="Cities" onClick={() => {
        if (activeTab == "Cities") {
            playClickSound2();
        } else {
        playClickSound3();
        }
        onSelect(target)}}>
        Cities
    </button>

    <button className="Stores" onClick={() => onSelect("Stores")}>
        Stores
    </button>

    <button className="Upgrades" onClick={() => onSelect("Upgrades")}>
        Upgrades
    </button>

    <button className="Progress" onClick={() => onSelect("Progress")}>
        Progress
    </button>

    <button className="Settings" onClick={() => onSelect("Settings")}>
        Settings
    </button>

    </div>

    )

}

export default BottomNav