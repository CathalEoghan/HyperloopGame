

import './TopBanner.css'

function TopBanner({terminalName, balance}) {

return (

<div className="TopBanner">
<h1 className= "TerminalName" >{terminalName}</h1>

<div className="balance">
    💰 £{balance.toFixed(2)}
</div>

<div className="MysterySpot">

</div>
</div>

)

}

export default TopBanner