
// City.js
export class City {
    constructor(name, population, rewards = [], country, tier) {
        this.name = name;
        this.population = population;
        this.rewards = rewards;
        this.country = country;
        this.tier = tier;
        this.connected = false;
    }

    unlock() {
        this.connected = true;
    }

}

  