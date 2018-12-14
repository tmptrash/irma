/**
 * Class of one organism
 *
 * @author flatline
 */
const Config = require('./../Config');
const Helper = require('./../common/Helper');

class Organism {
    constructor(id, x, y, item, energy, color) {
        this.last   = 0;
        this.item   = item;

        this.id     = id;
        this.x      = x;
        this.y      = y;
        /**
         * {Number} Data register
         */
        this.d      = 0;
        /**
         * {Number} Additional register a
         */
        this.a      = 0;
        /**
         * {Number} Additional register b
         */
        this.b      = 0;
        /**
         * {Number} Organism's age - amount of iteration from born
         */
        this.age    = 0;
        /**
         * {Number} Amount of energy
         */
        this.energy = energy;
        /**
         * {Number} Color of organism
         */
        this.color  = color;
        /**
         * {Array} Array of numbers. Code (DNA) of organism
         */
        this.code   = [];
        this.mem    = new Array(Config.orgMemSize);
    }

    clone() {
        const org = new Organism(Helper.id(), this.x, this.y, this.item, this.energy, this.color);

        org.last = this.last;
        org.d    = this.d;
        org.a    = this.a;
        org.b    = this.b;
        org.code = this.code.slice();
        org.mem  = this.mem.slice();

        return org;
    }
}

module.exports = Organism;