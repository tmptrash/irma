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
    constructor(id, offs, item, orgItem, parent = null, code = null, isOrg = false) {
        return this.init(...arguments);
    }

    init(id, offs, item, orgItem, parent = null, code = null, isOrg = false) {
        this.item       = item;
        this.offset     = offs;
        this.isOrg      = isOrg;
        //
        // For simple molecules we don't need to store all commands related data
        //
        if (!isOrg) {
            this.code = code && code.slice() || this._generateCode();
            return this;
        }

        this.id         = id;
        this.color      = 0x000000;
        this.orgItem    = orgItem;
        this.mutations  = 0;
        this.packet     = null;
        this.mem        = (new Array(Config.orgMaxCodeSize)).fill(0);
        this._memIdx    = -1;
        this.age        = 1;
        if (parent !== null) {
            this._clone(parent, code);
            return this;
        }

        this.probs      = Config.orgProbs.slice();
        this.period     = Config.orgMutationPeriod;
        this.percent    = Config.orgMutationPercent;

        this.freq       = 0;
        this.generation = 0;
        this.line       = 0;

        this.regs       = (new Array(Config.codeRegs)).fill(0);
        this.rIndex     = 0;
        /**
         * {Number} Register ax
         */
        this.ax         = 0;
        /**
         * {Number} Register bx
         */
        this.bx         = 0;
        this.ret        = 0;
        this.find0      = 0;
        this.find1      = 0;
        this.isLoop     = false;
        /**
         * {Number} Amount of functions in a code
         */
        this.fCount     = 0;
        /**
         * {Number} Current index in function call stack
         */
        this.stackIndex = -1;
        this.loopIndex  = -1;
        this.loops      = new Array(Config.orgMaxCodeSize).fill(-1); // TODO: use {}
        this.stack      = new Array(Config.CODE_STACK_SIZE * 3); // 2 registers + back line
        this.offs       = new Array(Config.orgMaxCodeSize); // TODO: use {}
        this.funcs      = new Array(Config.orgMaxCodeSize); // TODO: use {}
        /**
         * {Array} Array of numbers. Code (DNA) of organism
         */
        this.code       = code !== null ? code.slice() : this._generateCode();
        this.energy     = this.code.length * Config.energyMultiplier;
        this.preprocess();

        return this;
    }

    pop() {
        if (this._memIdx < 0) {return 0}
        return this.mem[this._memIdx--];
    }

    push(val) {
        if (this._memIdx >= Config.orgMaxCodeSize - 1) {return 0}
        this.mem[++this._memIdx] = val;
    }

    /**
     * Shifts ax, bx to the next two values in this.regs array
     */
    shift() {
        this.regs[this.rIndex] = this.ax;
        this.regs[this.rIndex + 1] = this.bx;
        if ((this.rIndex += 2) >= this.regs.length) {this.rIndex = 0}
        this.ax = this.regs[this.rIndex];
        this.bx = this.regs[this.rIndex + 1];
    }

    /**
     * Preprocesses code before run it. Finds all functions and map them
     * in org.funcs map. After this call operator start to work.
     */
    preprocess() {
        const code    = this.code;
        const offs    = this.offs;
        const funcs   = this.funcs;
        const stack   = new Array(Config.orgMaxCodeSize);
        let   sCount  = -1;
        let   fCount  = 0;

        for (let i = 0, len = code.length; i < len; i++) {
            switch(code[i]) {
                case CODE_CMD_OFFS + 24: // func
                    funcs[fCount++] = offs[i] = i + 1;
                    stack[++sCount] = i;
                    break;

                case CODE_CMD_OFFS + 22: // loop
                case CODE_CMD_OFFS + 15: // ifp
                case CODE_CMD_OFFS + 16: // ifn
                case CODE_CMD_OFFS + 17: // ifz
                case CODE_CMD_OFFS + 18: // ifg
                case CODE_CMD_OFFS + 19: // ifl
                case CODE_CMD_OFFS + 20: // ife
                case CODE_CMD_OFFS + 21: // ifne
                    stack[++sCount] = i;
                    offs[i] = i + 1;
                    break;

                case CODE_CMD_OFFS + 26: // end
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

    /**
     * Generates random code and code based on organism parts
     * @returns {Array}
     * @private
     */
    _generateCode() {
        if (Math.random() > .5) {
            const size = Config.molCodeSize;
            const code = new Array(size);
            for (let i = 0; i < size; i++) {code[i] = Mutations.randCmd()}
            return code;
        }
        const code  = Config.codeLuca;
        const len   = code.length;
        const start = Math.floor(Math.random() * (len - Config.molCodeSize));
        return code.slice(start, start + Config.molCodeSize);
    }

    _clone(parent, code) {
        this.color      = parent.color;
        this.probs      = parent.probs.slice();
        this.period     = parent.period;
        this.percent    = parent.percent;
        this.line       = parent.line;
        this.regs       = parent.regs.slice();
        this.rIndex     = parent.rIndex;
        this.ax         = parent.ax;
        this.bx         = parent.bx;
        this.ret        = parent.ret;
        this.find0      = parent.find0;
        this.find1      = parent.find1;
        this.isLoop     = parent.isLoop;
        this.fCount     = parent.fCount;
        this.stackIndex = parent.stackIndex;
        this.loopIndex  = parent.loopIndex;
        this.loops      = parent.loops.slice();
        this.stack      = parent.stack.slice();
        this.offs       = parent.offs.slice();
        this.funcs      = parent.funcs.slice();
        this.code       = code ? code : parent.code.slice();
        this.mem        = parent.mem.slice();
        this.generation = parent.generation + 1;
        this.freq       = parent.freq;

        this.preprocess();
    }
}

module.exports = Organism;