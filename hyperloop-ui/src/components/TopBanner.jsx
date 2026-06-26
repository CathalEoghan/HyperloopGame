
import './TopBanner.css'
import clockIcon from '../assets/misc/clock.png'
import cashIcon from '../assets/misc/cash.png'
import starIcon from '../assets/misc/star.png'

function TopBanner({terminalName, rank, balance}) {

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

<div className="MysterySpot">

</div>
</div>


)

}

export default TopBanner