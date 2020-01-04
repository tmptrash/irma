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
const BREAK                 = Config.CODE_CMDS.BREAK;

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
        this.re         = 0;                                           // Register re
        this.isLoop     = false;                                       // Uses with loop command (see loop+end commands)
        this.fCount     = 0;                                           // Amount of functions in a code
        this.stackIndex = -1;                                          // Current index in stack (used for function calls)

        this.loops      = {};                                          // Offsets of end operator for loop operator
        this.stack      = new Int32Array(Config.CODE_STACK_SIZE * 3);  // ax, bx + back line
        this.offs       = {};                                          // General offsets array (ifxx, loop, func, end operators)
        this.funcs      = {};                                          // Array for function offsets
    }

    /**
     * Preprocesses code before run it. Finds all functions and map them
     * in org.funcs map. After this call operator start to work.
     * @param {Number} index1 Start index in a code, where change was occure
     * @param {Number} index2 End index in a code where changed were occure
     * @param {Number} dir Direction. 1 - inserted code, -1 - removed code
     */
    compile(index1 = 0, index2 = 0, dir = 1) {
        const code   = this.code;
        const offs   = this.offs  = {};
        const funcs  = this.funcs = {};
        const stack  = new Int16Array(Config.orgMaxCodeSize);
        const loops  = new Int16Array(Config.orgMaxCodeSize);
        let   lCount = -1;
        let   sCount = -1;
        let   fCount = 0;

        this.loops = {};
        for (let i = 0, len = code.length; i < len; i++) {
            // eslint-disable-next-line default-case
            switch(code[i] & CODE_8_BIT_RESET_MASK) {
                case FUNC:
                    funcs[fCount++] = offs[i] = i + 1;
                    stack[++sCount] = i;
                    break;

                case LOOP:
                    loops[++lCount] = i;
                    stack[++sCount] = i;
                    offs[i] = i + 1;
                    break;

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

                case BREAK:
                    if (sCount < 0) {break}
                    offs[i] = loops[lCount]; // loop offs
                    break;

                case END:
                    if (sCount < 0) {break}
                    if ((code[stack[sCount]] & CODE_8_BIT_RESET_MASK) === LOOP) {lCount--}
                    offs[i] = stack[sCount];
                    offs[stack[sCount--]] = i + 1;
                    break;
            }
        }

        if (index2 === 0) {                                             // This is first time we compile the code. We don't need to update 
            this.line       = 0;                                        // stack and current line. Just set default values.
            this.stackIndex = -1;
            this.fCount     = fCount;
            return;
        }
        
        const amount = (index2 - index1) * dir;                         // This is second or more time we compile the code. We have to update
        const line   = this.line;                                       // call stack and current line depending on amount of changes in a code
        if (line > index2) {this.line += amount}
        else if (line >= index1 && line <= index2) {this.line = index1}
        
        if (this.fCount !== fCount) {this.stackIndex = -1}              // Amount of functions were changed. In this case, we have to remove call stack
        else {                                                          // Updates every call stack item according to code changes
            const stk = this.stack;
            for (let i = 0; i < 0; i += 3) {
                const ln = stk[i];                                      // Updates back line
                if (ln > index2) {stk[i] += amount}
                else if (ln >= index1 && ln <= index2) {stk[i] = index1}
            }
        }

        this.fCount = fCount;                                           // Functions amount must be updated in any case
    }
}

module.exports = Organism;