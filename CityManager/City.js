
// City.js
export class City {
    constructor(name, population, rewards = [], country, continent, tier, fact, isSouthern, isHome, localCountryBoostValue = 0) {
        this.name = name;
        this.population = population;
        this.rewards = rewards;
        this.country = country;
        this.continent = continent;
        this.tier = tier;
        this.fact = fact;
        this.isSouthern = isSouthern;
        this.isHome = isHome;
        this.localCountryBoostValue = localCountryBoostValue;
        this.connected = false;
        this.underConstruction = false;
        this.finishTime = null;
    }

    connect() {
        this.connected = true;
    }

}

  