
import { ProgressionManager } from "../Managers/ProgressionManager/ProgressionManager.js";
import { TimeManager } from "../Managers/TimeManager/TimeManager.js";
import { GameManager } from '../Managers/GameManager/GameManager.js'
import { ConstructionManager } from '../Managers/ConstructionManager/ConstructionManager.js'
import { EconomyManager } from '../Managers/EconomyManager/EconomyManager.js'
import { RankManager } from '../Managers/RankManager/RankManager.js'
import { London } from '../CityManager/London.js'

class Main {

// Starts the game, creates new Manager objects
startGame() {

    const timeManager = new TimeManager();
    const rankManager = new RankManager();
    const progressionManager = new ProgressionManager(rankManager);
    const constructionManager = new ConstructionManager(progressionManager, timeManager);
    const economyManager = new EconomyManager(progressionManager);
    const gameManager = new GameManager(economyManager, progressionManager, constructionManager, rankManager);
    const interval = setInterval(() => gameManager.tick(), 1000); // Initiates the tick() every 1 second

    gameManager.setStartingCity(London);

}

}

    const main = new Main();
    main.startGame();