
import { ProgressionManager } from "../Managers/ProgressionManager/ProgressionManager.js";
import { TimeManager } from "../Managers/TimeManager/TimeManager.js";
import { GameManager } from '../Managers/GameManager/GameManager.js'
import { ConstructionManager } from '../Managers/ConstructionManager/ConstructionManager.js'
import { EconomyManager } from '../Managers/EconomyManager/EconomyManager.js'

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

    const main = new Main();
    main.startGame();