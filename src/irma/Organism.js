/**
 * Class of one organism
 *
 * @author flatline
 */
const Config    = require('./../Config');
const Mutations = require('./Mutations');
/**
 * {Number} This offset will be added to commands value. This is how we
 * add an ability to use numbers in a code, just putting them as command
 */
const CODE_CMD_OFFS = Config.CODE_CMD_OFFS;

class Organism {
    constructor(id, x, y, item, energy, parent = null) {
        this.id         = id;
        this.item       = item;
        this.x          = x;
        this.y          = y;
        /**
         * {Number} Organism's age - amount of iteration from born
         */
        this.age        = 0;
        this.dot        = 0x000000;
        this.steps      = 0;
        this.radiation  = 0;
        /**
         * {Array} Temporary offsets array. Is used durinf preprocessing
         */
        this._offs      = new Array(Config.orgMaxCodeSize);
        if (parent !== null) {
            this._clone(parent);
            return;
        }

        this.line       = 0;
        this.probs      = Config.orgProbs.slice();
        this.probArr    = this.createProbArr();
        this.period     = Config.orgMutationPeriod;
        this.percent    = Config.orgMutationPercent;
        /**
         * {Number} Data register
         */
        this.d          = 0;
        /**
         * {Number} Additional register a
         */
        this.a          = 0;
        /**
         * {Number} Additional register b
         */
        this.b          = 0;
        /**
         * {Number} Amount of energy
         */
        this.energy     = energy;
        /**
         * {Number} Amount of functions in a code
         */
        this.fCount     = 0;
        /**
         * {Number} Current index in function call stack
         */
        this.stackIndex = -1;
        this.offs       = new Array(Config.orgMaxCodeSize);
        this.funcs      = new Array(Config.orgMaxCodeSize);
        this.stack      = new Array(Config.CODE_STACK_SIZE * 4); // 3 registers + back line
        this.mem        = (new Array(Config.orgMemSize)).fill(0);
        /**
         * {Array} Array of numbers. Code (DNA) of organism
         */
        this.code       = this._generateCode();
        this.preprocess();
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

    /**
     * Preprocesses code before run it. Finds all functions and map them
     * in org.funcs map. After this call operator start to work.
     */
    preprocess() {
        const code   = this.code;
        const offs   = this.offs;
        const funcs  = this.funcs;
        const stack  = this._offs;
        let   sCount = -1;
        let   fCount = 0;

        for (let i = 0, len = code.length; i < len; i++) {
            switch(code[i]) {
                case CODE_CMD_OFFS + 25: // func
                    funcs[fCount++] = i + 1;
                    stack[++sCount] = i;
                    break;

                case CODE_CMD_OFFS + 27: // end
                    if (sCount < 0) {break}
                    offs[stack[sCount--]] = i + 1;
                    break;
            }
        }

        if (sCount >= 0) {for (let i = sCount; i >= 0; i--) {offs[stack[i]] = 0}}

        this.fCount     = fCount;
        this.stackIndex = -1;
        this.line       = 0;
    }

    _generateCode() {
        const size    = Config.orgStartCodeSize;
        const code    = new Array(size);
        const codeLen = Config.codeDefault.length;

        code.splice(0, codeLen, ...Config.codeDefault);
        if (Config.orgRandCodeOnStart) {
            for (let i = codeLen; i < size; i++) {code[i] = Mutations.randCmd()}
        } else {
            for (let i = codeLen; i < size; i++) {code[i] = CODE_CMD_OFFS + 18}
        }

        return code;
    }

    _clone(parent) {
        this.probs      = parent.probs.slice();
        this.probArr    = parent.probArr.slice();
        this.period     = parent.period;
        this.percent    = parent.percent;
        this.line       = parent.line;
        this.d          = parent.d;
        this.a          = parent.a;
        this.b          = parent.b;
        this.fCount     = parent.fCount;
        this.stackIndex = parent.stackIndex;
        this.offs       = parent.offs.slice();
        this.funcs      = parent.funcs.slice();
        this.stack      = parent.stack.slice();
        this.mem        = parent.mem.slice();
        this.code       = parent.code.slice();
    }
}

module.exports = Organism;