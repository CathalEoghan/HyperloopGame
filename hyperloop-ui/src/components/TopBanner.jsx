
import './TopBanner.css'
import clockIcon from '../assets/misc/clock.png'
import cashIcon from '../assets/misc/cash.png'
import starIcon from '../assets/misc/star.png'
import { playClickSound2 } from '../utils/sound.js'
import { playClickSound3 } from '../utils/sound.js'
import departureBoardImg from '../assets/misc/DepartureBoard.jpg'
import reputationIcon from '../assets/misc/reputation.png'

function TopBanner({ terminalName, balance, rank, activeTab, onSelect, reputation }) {

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
    <img src= {cashIcon} alt="balance" /> £{Math.floor(balance).toLocaleString('en-GB')}
</div>

<div className="reputation">
    <img src={reputationIcon} alt="reputation" /> {reputation}
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
    style={{
        cursor: "pointer",
        backgroundImage: `url(${departureBoardImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    }}
>
    <span className="MysterySpotLabel">Departure Board</span>
</button>
</div>


)

}

export default TopBanner