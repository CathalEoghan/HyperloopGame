
import { ProgressionManager } from "../ProgressionManager/ProgressionManager.js";
import { TimeManager } from "../TimeManager/TimeManager.js";
import { GameManager } from '../GameManager/GameManager.js'
import { ConstructionManager } from '../ConstructionManager/ConstructionManager.js'
import { EconomyManager } from '../EconomyManager/EconomyManager.js'

class Main {

startGame() {

    const timeManager = new TimeManager();
    const progressionManager = new ProgressionManager();
    const constructionManager = new ConstructionManager(progressionManager, timeManager);
    const economyManager = new EconomyManager(progressionManager);
    const gameManager = new GameManager(economyManager, progressionManager, constructionManager);
    gameManager.tick()

}

}