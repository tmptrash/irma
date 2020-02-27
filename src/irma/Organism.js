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
const ORG_MAX_MEM_SIZE      = Config.ORG_MAX_MEM_SIZE;
const CODE_STACK_SIZE       = Config.CODE_STACK_SIZE;
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
        this.mem        = new Int32Array(ORG_MAX_MEM_SIZE);            // Organism's memory
        this.mPos       = 0;                                           // Memory cell position
        this.age        = 1;                                           // Organism's age. Increases every iteration. Should be 1, not 0 to prevent mutations on start
        this.probs      = Config.orgProbs.slice();                     // Probabilities for different types of mutations
        this.period     = Config.orgMutationPeriod;                    // Amount of iterations between mutations
        this.percent    = Config.orgMutationPercent;                   // Percent of mutations
        this.freq       = 0;                                           // Frequency for say, listen commands
        this.line       = 0;                                           // Current code line index
        this.ax         = 0;                                           // int 32 register - ax
        this.bx         = 0;                                           // int 32 register - bx
        this.isLoop     = false;                                       // Uses with loop command (see loop+end commands)
        this.fCount     = 0;                                           // Amount of functions in a code
        this.stackIndex = -1;                                          // Current index in stack (used for function calls)

        this.loops      = {};                                          // Offsets of end operator for loop operator
        this.stack      = new Uint16Array(CODE_STACK_SIZE);            // Back lines
        this.offs       = {};                                          // General offsets array (ifxx, loop, func, end operators)
        this.funcs      = {};                                          // Array for function offsets
    }
}

module.exports = Organism;