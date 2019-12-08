/**
 * Container for organism. Optimized for size, because amout of organisms
 * in a population should be maximum. We should use typed arrays for that
 * and mimimum amount of properties. Compilation means code preprocessing
 * before run. It produces code metadata, which is used during code run.
 *
 * @author flatline
 */
const Config                = require('./../Config');

const CODE_8_BIT_RESET_MASK = Config.CODE_8_BIT_RESET_MASK;
//
// Basic commands
//
const IFP                   = Config.CODE_CMDS.IFP;
const IFN                   = Config.CODE_CMDS.IFN;
const IFZ                   = Config.CODE_CMDS.IFZ;
const IFG                   = Config.CODE_CMDS.IFG;
const IFL                   = Config.CODE_CMDS.IFL;
const IFE                   = Config.CODE_CMDS.IFE;
const IFNE                  = Config.CODE_CMDS.IFNE;
const LOOP                  = Config.CODE_CMDS.LOOP;
const FUNC                  = Config.CODE_CMDS.FUNC;
const END                   = Config.CODE_CMDS.END;

class Organism {
    /**
     * Creates new, default organism. We don't do code copy!
     * @param {Number} index Index of this organism in population list
     * @param {Uint8Array} code Code of organism we need to set
     */
    constructor(index, code) {
        this.index      = index;                                       // Index in population list
        this.code       = code;                                        // Organism's code on "line" language
        this.mem        = new Int32Array(Config.orgMaxMemSize);        // Organism's memory
        this.memPos     = 0;                                           // Memory cell position
        this.age        = 1;                                           // Organism's age. Increases every iteration
        this.probs      = Config.orgProbs.slice();                     // Probabilities for different types of mutations
        this.period     = Config.orgMutationPeriod;                    // Amount of iterations between mutations
        this.percent    = Config.orgMutationPercent;                   // Percent of mutations
        this.freq       = 0;                                           // Frequency for say, listen commands
        this.line       = 0;                                           // Current code line index
        this.ax         = 0;                                           // Register ax
        this.bx         = 0;                                           // Register bx
        this.ret        = 0;                                           // Register ret
        this.isLoop     = false;                                       // Uses with loop command (see loop+end commands)
        this.fCount     = 0;                                           // Amount of functions in a code
        this.stackIndex = -1;                                          // Current index in stack (used for function calls)

        this.loops      = {};                                          // Offsets of end operator for loop operator
        this.stack      = new Int32Array(Config.CODE_STACK_SIZE * 3);  // 2 registers + back line
        this.offs       = {};                                          // General offsets array (ifxx, loop, func, end operators)
        this.funcs      = {};                                          // Array for function offsets
    }

    /**
     * Preprocesses code before run it. Finds all functions and map them
     * in org.funcs map. After this call operator start to work.
     */
    compile() {
        const code     = this.code;
        const offs     = this.offs;
        const funcs    = this.funcs;
        const stack    = new Int16Array(Config.orgMaxCodeSize);
        let   sCount   = -1;
        let   fCount   = 0;

        for (let i = 0, len = code.length; i < len; i++) {
            // eslint-disable-next-line default-case
            switch(code[i] & CODE_8_BIT_RESET_MASK) {
                case FUNC:
                    funcs[fCount++] = offs[i] = i + 1;
                    stack[++sCount] = i;
                    break;

                case LOOP:
                case IFP:
                case IFN:
                case IFZ:
                case IFG:
                case IFL:
                case IFE:
                case IFNE:
                    stack[++sCount] = i;
                    offs[i] = i + 1;
                    break;

                case END:
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