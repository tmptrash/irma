/**
 * Class of one organism
 *
 * @author flatline
 */
const Config = require('./../Config');
const Helper = require('./../common/Helper');

class Organism {
    constructor(id, x, y, item, energy, color, parent = null) {
        this.last     = 0;
        this.item     = item;
        this.probs    = Config.orgProbs.slice();
        this.period   = Config.orgMutationPeriod;
        this.percent  = Config.orgMutationPercent;

        this.id       = id;
        this.x        = x;
        this.y        = y;
        /**
         * {Number} Data register
         */
        this.d        = 0;
        /**
         * {Number} Additional register a
         */
        this.a        = 0;
        /**
         * {Number} Additional register b
         */
        this.b        = 0;
        /**
         * {Number} Organism's age - amount of iteration from born
         */
        this.age      = 0;
        /**
         * {Number} Amount of energy
         */
        this.energy   = energy;
        /**
         * {Number} Color of organism
         */
        this.color    = color;
        /**
         * {Array} Array of numbers. Code (DNA) of organism
         */
        this.code     = [];
        this.mem      = parent ? null: (new Array(Config.orgMemSize)).fill(0);

        parent && this._clone();
    }

    _clone(x, y) {
        const org = new Organism(Helper.id(), x, y, this.item, this.energy, this.color);

        org.probs   = this.probs.slice();
        org.period  = this.period;
        org.percent = this.percent;
        org.last    = this.last;
        org.d       = this.d;
        org.a       = this.a;
        org.b       = this.b;
        org.code    = this.code.slice();
        org.mem     = this.mem.slice();

        return org;
    }
}

module.exports = Organism;