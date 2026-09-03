
// Upgrade.js
export class Upgrade {
    constructor(name, cost, category, effectType, effectValue, targetCountry) {
        this.name = name;
        this.cost = cost;
        this.category = category;
        this.effectType = effectType;
        this.effectValue = effectValue;
        this.country = targetCountry;
        this.underConstruction = false;
        this.finishTime = null;
    }
}