
import { useState, useEffect } from "react"
import './App.css'

function App() {

const [balance, setBalance] = useState(0);

useEffect(() => {
  setInterval(() => {
    setBalance(prev => prev + (8000 / 86400))
  }, 1000)
}, [])

return (

<div className= "TerminalName">
<h1>Hyperloop Central</h1>

<h2>Your balance:</h2>

<p>£{balance.toFixed(2)}</p>
</div>

)

}

export default App