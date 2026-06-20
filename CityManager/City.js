
// City.js
export class City {
    constructor(name, population, rewards = [], country, tier, fact) {
        this.name = name;
        this.population = population;
        this.rewards = rewards;
        this.country = country;
        this.tier = tier;
        this.fact = fact;
        this.connected = false;
        this.underConstruction = false;
        this.finishTime = null;
    }

    unlock() {
        this.connected = true;
    }

}

  