
// Development.js

const REVENUE_SCALE = 6.5;

export class Development {
    constructor(name, cost, category, revenue) {
        this.name = name;
        this.cost = cost;
        this.category = category;
        this.revenue = revenue ? Math.round(revenue * REVENUE_SCALE) : revenue;
        this.level = 1;
        this.underConstruction = false;
        this.finishTime = null;
    }

}