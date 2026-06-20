
import { ProgressionManager } from "../ProgressionManager/ProgressionManager.js";
import { TimeManager } from "../TimeManager/TimeManager.js";
import { GameManager } from '../GameManager/GameManager.js'
import { ConstructionManager } from '../ConstructionManager/ConstructionManager.js'
import { EconomyManager } from '../EconomyManager/EconomyManager.js'

class Main {

startGame() {

    const timeManager = new TimeManager();
    const progressionManager = new ProgressionManager();
    const constructionManager = new ConstructionManager();
    const economyManager = new EconomyManager();
    GameManager.tick()

}

}