/**
 * Class of one organism
 *
 * @author flatline
 */
const Config    = require('./../Config');
const Mutations = require('./Mutations');

class Organism {
    constructor(id, x, y, item, energy, parent = null) {
        this.id        = id;
        this.item      = item;
        this.x         = x;
        this.y         = y;
        /**
         * {Number} Organism's age - amount of iteration from born
         */
        this.age       = 0;
        this.dot       = 0x000000;
        this.steps     = 0;
        this.radiation = 0;
        if (parent !== null) {
            this._clone(parent);
            return;
        }

        this.last      = 0;
        this.probs     = Config.orgProbs.slice();
        this.probArr   = this.createProbArr();
        this.period    = Config.orgMutationPeriod;
        this.percent   = Config.orgMutationPercent;
        /**
         * {Number} Data register
         */
        this.d         = 0;
        /**
         * {Number} Additional register a
         */
        this.a         = 0;
        /**
         * {Number} Additional register b
         */
        this.b         = 0;
        /**
         * {Number} Amount of energy
         */
        this.energy    = energy;
        /**
         * {Array} Array of numbers. Code (DNA) of organism
         */
        this.code      = this._getRandomCode();
        this.mem       = (new Array(Config.orgMemSize)).fill(0);
    }

    createProbArr() {
        const probs  = this.probs;
        let   amount = 0;
        for (let i = 0, iLen = probs.length; i < iLen; i++) {amount += probs[i]}
        const arr    = new Array(amount);
        for (let i = 0, c = 0, iLen = probs.length; i < iLen; i++) {
            for (let j = 0, jLen = probs[i]; j < jLen; j++) {
                arr[c++] = i;
            }
        }

        return arr;
    }

    _getRandomCode() {
        const size = Config.orgStartCodeSize;
        const code = new Array(size);

        for (let i = 0; i < size; i++) {code[i] = Mutations.randCmd()}

        return code;
    }

    _clone(parent) {
        this.probs   = parent.probs.slice();
        this.probArr = parent.probArr.slice();
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