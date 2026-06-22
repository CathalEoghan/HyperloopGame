
import { playClickSound2 } from '../utils/sound.js'
import { playClickSound3 } from '../utils/sound.js'
import './BottomNav.css'

function BottomNav({activeTab, onSelect}) {

    const targetCities = activeTab === "Cities" ? "Home" : "Cities"
    const targetStores = activeTab === "Stores" ? "Home" : "Stores"
    const targetUpgrades = activeTab === "Upgrades" ? "Home" : "Upgrades"
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

     <button className="Stores" onClick={() => {
        if (activeTab == "Stores") {
            playClickSound3();
        } else {
        playClickSound2();
        }
        onSelect(targetStores)}}>
        Stores
    </button>

    <button className="Upgrades" onClick={() => {
        if (activeTab == "Upgrades") {
            playClickSound3();
        } else {
        playClickSound2();
        }
        onSelect(targetUpgrades)}}>
        Upgrades
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