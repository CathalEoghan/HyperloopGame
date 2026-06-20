
import { PlayerProgression } from "../ProgressionManager/PlayerProgression.js";
import { TimeManager } from "../TimeManager/Time.js";
import { GameEngine } from '../GameEngine/Game.js'
import { Construction } from '../ConstructionManager/Construction.js'
import { Economy } from '../EconomyManager/Economy.js'

class Main {

startGame() {

    timeManager = new TimeManager();
    playerProgression = new PlayerProgression();
    GameEngine.tick()

}

}