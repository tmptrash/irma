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
    constructor(id, x, y, sharedObj, item, energy, parent = null) {
        this.id         = id;
        this.item       = item;
        this.x          = x;
        this.y          = y;
        /**
         * {Number} Organism's age - amount of iteration from born
         */
        this.age        = 0;
        this.dot        = 0x000000;
        this.packet     = 0;
        this.steps      = 0;
        this.moves      = Config.orgMovesInStep;
        this.radiation  = 0;
        this.mutations  = 0;
        this._sharedObj = sharedObj;
        /**
         * {Number} Amount of energy
         */
        this._energy    = energy;
        sharedObj.totalOrgsEnergy += energy;
        if (parent !== null) {
            this._clone(parent);
            return;
        }

        this.generation = 0;
        this.line       = 0;
        this.probs      = Config.orgProbs.slice();
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
         * {Number} Amount of functions in a code
         */
        this.fCount     = 0;
        /**
         * {Number} Current index in function call stack
         */
        this.stackIndex = -1;
        this.loopIndex  = -1;
        this.loops      = new Array(Config.orgMaxCodeSize).fill(-1);
        this.stack      = new Array(Config.CODE_STACK_SIZE * 5); // 3 registers + back line + func end line
        this.offs       = new Array(Config.orgMaxCodeSize);
        this.funcs      = new Array(Config.orgMaxCodeSize);
        this.mem        = (new Array(Config.orgMemSize)).fill(0);
        /**
         * {Array} Array of numbers. Code (DNA) of organism
         */
        this.code       = this._generateCode();
        this.preprocess();
    }

    get energy() {
        return this._energy;
    }

    set energy(e) {
        this._sharedObj.totalOrgsEnergy += (e - this._energy);
        this._energy = e;
    }

    /**
     * Preprocesses code before run it. Finds all functions and map them
     * in org.funcs map. After this call operator start to work.
     */
    preprocess() {
        const code    = this.code;
        const offs    = this.offs;
        const funcs   = this.funcs;
        const loops   = this.loops;
        const stack   = new Array(Config.orgMaxCodeSize);
        let   sCount  = -1;
        let   fCount  = 0;

        for (let i = 0, len = code.length; i < len; i++) {
            switch(code[i]) {
                case CODE_CMD_OFFS + 25: // func
                    funcs[fCount++] = i + 1;
                    stack[++sCount] = i;
                    break;

                case CODE_CMD_OFFS + 14: // loop
                    loops[i] = -1;
                case CODE_CMD_OFFS + 15: // ifdga
                case CODE_CMD_OFFS + 16: // ifdla
                case CODE_CMD_OFFS + 17: // ifdea
                    stack[++sCount] = i;
                    offs[i] = i + 1;
                    break;

                case CODE_CMD_OFFS + 27: // end
                    if (sCount < 0) {break}
                    offs[i] = stack[sCount];
                    offs[stack[sCount--]] = i + 1;
                    break;
            }
        }

        this.fCount     = fCount;
        this.stackIndex = -1;
        this.loopIndex  = -1;
        this.line       = 0;
    }

    _generateCode() {
        const size    = Config.orgStartCodeSize;
        const code    = new Array(size);

        if (Config.codeDefault.length === 0) {
            for (let i = 0; i < size; i++) {code[i] = Mutations.randCmd()}
        } else {
            const codeLen = Config.codeDefault.length;
            code.splice(0, codeLen, ...Config.codeDefault);
            for (let i = codeLen; i < size; i++) {code[i] = CODE_CMD_OFFS + 18}
        }

        return code;
    }

    _clone(parent) {
        this.probs      = parent.probs.slice();
        this.period     = parent.period;
        this.percent    = parent.percent;
        this.line       = parent.line;
        this.d          = parent.d;
        this.a          = parent.a;
        this.b          = parent.b;
        this.fCount     = parent.fCount;
        this.stackIndex = parent.stackIndex;
        this.loopIndex  = parent.loopIndex;
        this.offs       = parent.offs.slice();
        this.funcs      = parent.funcs.slice();
        this.stack      = parent.stack.slice();
        this.loops      = parent.loops.slice();
        this.mem        = parent.mem.slice();
        this.code       = parent.code.slice();
        this.generation = parent.generation + 1;
    }
}

module.exports = Organism;