/**
 * Class of one organism
 *
 * @author flatline
 */
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
    }
}

module.exports = Organism;