/**
 * Container for organism. Optimized for size, because amout of organisms
 * in a population should be maximum. We should use typed arrays for that
 * and mimimum amount of properties. Compilation means code preprocessing
 * before run. It produces code metadata, which is used during code run.
 * There are two types of organisms: normal and simple. Normal is an organism
 * with all properties defined in this class. This is what we call digital
 * organism. Simple, is a short organism only with code and index within 
 * population list.
 *
 * @author flatline
 */
const Config = require('./../Config');

class Organism {
    /**
     * Creates new, default organism. We don't do code copy! May create 
     * simple organism only with code and world position reference.
     * @param {Number} index Index of this organism in population list
     * @param {Uint8Array} code Code of organism we need to set
     * @param {Boolean} simple Create simple organism
     */
    constructor(index, code, simple = false) {
        this.index      = index;                                       // Index in population list
        this.code       = code;                                        // Organism's code on "line" language
        if (simple) {return this}
        this.mem        = new Int32Array(Config.orgMaxMemSize);        // Organism's memory
        this.pos        = 0;                                           // Memory cell position
        this.age        = 1;                                           // Organism's age. Increases every iteration
        this.probs      = Config.orgProbs.slice();                     // Probabilities for different types of mutations
        this.period     = Config.orgMutationPeriod;                    // Amount of iterations between mutations
        this.percent    = Config.orgMutationPercent;                   // Percent of mutations
        this.freq       = 0;                                           // Frequency for say, listen commands
        this.line       = 0;                                           // Current code line index
        this.rIndex     = 0;                                           // Pointer to additional register. Depricated
        this.ax         = 0;                                           // Register ax
        this.bx         = 0;                                           // Register bx
        this.ret        = 0;                                           // Register ret
        this.find0      = 0;                                           // Offsets0 in code for move command (was set by find command)
        this.find1      = 0;                                           // Offsets1 in code for move command (was set by find command)
        this.isLoop     = false;                                       // Uses with loop command (see loop+end commands)
        this.fCount     = 0;                                           // Amount of functions in a code
        this.stackIndex = -1;                                          // Current index in stack (used for function calls)

        const codeSize = Config.orgMaxCodeSize;
        this.loops      = new Int16Array(codeSize).fill(-1);           // Offsets of end operator for loop operator
        this.stack      = new Int32Array(Config.CODE_STACK_SIZE * 3);  // 2 registers + back line
        this.offs       = new Uint16Array(codeSize);                   // General offsets array (ifxx, loop, func, end operators)
        this.funcs      = new Array(codeSize);                         // Array for function offsets
    }

    /**
     * Preprocesses code before run it. Finds all functions and map them
     * in org.funcs map. After this call operator start to work.
     */
    compile() {
        const CMD_OFFS = Config.CODE_CMD_OFFS;
        const code     = this.code;
        const offs     = this.offs;
        const funcs    = this.funcs;
        const stack    = new Int16Array(Config.orgMaxCodeSize);
        let   sCount   = -1;
        let   fCount   = 0;

        for (let i = 0, len = code.length; i < len; i++) {
            switch(code[i]) {
                case CMD_OFFS + 24: // func
                    funcs[fCount++] = offs[i] = i + 1;
                    stack[++sCount] = i;
                    break;

                case CMD_OFFS + 22: // loop
                case CMD_OFFS + 15: // ifp
                case CMD_OFFS + 16: // ifn
                case CMD_OFFS + 17: // ifz
                case CMD_OFFS + 18: // ifg
                case CMD_OFFS + 19: // ifl
                case CMD_OFFS + 20: // ife
                case CMD_OFFS + 21: // ifne
                    stack[++sCount] = i;
                    offs[i] = i + 1;
                    break;

                case CMD_OFFS + 26: // end
                    if (sCount < 0) {break}
                    offs[i] = stack[sCount];
                    offs[stack[sCount--]] = i + 1;
                    break;
            }
        }

        this.fCount     = fCount;
        this.stackIndex = -1;
        this.line       = 0;
    }
}

module.exports = Organism;