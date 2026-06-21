
import './BottomNav.css'

function BottomNav({activeTab, onSelect}) {

    return (

    <div className="bottomNav">

    <button className="Cities" onClick={() => onSelect("Cities")}>
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