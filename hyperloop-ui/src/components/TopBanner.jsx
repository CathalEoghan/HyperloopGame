
import './TopBanner.css'
import clockIcon from '../assets/misc/clock.png'
import cashIcon from '../assets/misc/cash.png'
import starIcon from '../assets/misc/star.png'
import { playClickSound2 } from '../utils/sound.js'
import { playClickSound3 } from '../utils/sound.js'

function TopBanner({ terminalName, balance, rank, activeTab, onSelect }) {

return (

<div className="TopBanner">
<h1 className= "TerminalName" >{terminalName}</h1>

<div className="rightSideDetails">

    <div className="time">
    <img src= {clockIcon} alt="time" /> {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
</div>

<div className="rank">
    <img src= {starIcon} alt="rank" /> Rank {rank}
</div>

<div className="balance">
    <img src= {cashIcon} alt="balance" /> £{balance.toFixed(2)}
</div>

</div>

<button
    className="MysterySpot"
    onClick={() => {
        if (activeTab === "DepartureBoard") {
            playClickSound3();
        } else {
            playClickSound2();
        }

        onSelect(activeTab === "DepartureBoard" ? "Home" : "DepartureBoard");
    }}
    style={{ cursor: "pointer" }}
>
    Mystery Spot
</button>
</div>


)

}

export default TopBanner