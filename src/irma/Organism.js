/**
 * Class of one organism
 *
 * @author flatline
 */
const Config = require('./../Config');

class Organism {
    constructor(id, x, y, item, energy, parent = null) {
        this.id       = id;
        this.item     = item;
        this.x        = x;
        this.y        = y;
        /**
         * {Number} Organism's age - amount of iteration from born
         */
        this.age      = 0;
        if (parent !== null) {
            this._clone(parent);
            return;
        }

        this.last     = 0;
        this.probs    = Config.orgProbs.slice();
        this.period   = Config.orgMutationPeriod;
        this.percent  = Config.orgMutationPercent;
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
         * {Number} Amount of energy
         */
        this.energy   = energy;
        /**
         * {Array} Array of numbers. Code (DNA) of organism
         */
        this.code     = [];
        this.mem      = (new Array(Config.orgMemSize)).fill(0);
    }

    _clone(parent) {
        this.probs   = parent.probs.slice();
        this.period  = parent.period;
        this.percent = parent.percent;
        this.last    = parent.last;
        this.d       = parent.d;
        this.a       = parent.a;
        this.b       = parent.b;
        this.code    = parent.code.slice();
        this.mem     = parent.mem.slice();
    }
}

module.exports = Organism;