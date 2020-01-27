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

    /**
     * Compiles code before run it. Compilation means to find pairs of block
     * operations. Fro example: ifxx..end, loop..end, func..end, call..ret
     * and so on. We store this metadata in Organism.offs|funcs|stack. After
     * every code change (mutation) we have to compile it again to update 
     * this metadata.
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
        
        this.updateMetadata(index1, index2, dir, fCount);

        this.fCount = fCount;                                           // Functions amount must be updated in any case
    }

    /**
     * This method only updates metadata: Organism.offs|funcs|stack.
     * @param {Number} index1 Start index in a code, where change was occure
     * @param {Number} index2 End index in a code where changed were occure
     * @param {Number} dir Direction. 1 - inserted code, -1 - removed code
     * @param {Number} fCount Previous amount of functions in a code
     */
    updateMetadata(index1 = 0, index2 = 0, dir = 1, fCount = -1) {
        const amount = (index2 - index1) * dir;
        //
        // Updates current line
        //
        const line   = this.line;
        if (line > index2) {this.line += amount}
        else if (line >= index1 && line <= index2) {this.line = index1}
        //
        // Updates function metadata (indexes in a code). If amount of functions
        // were changed we have to remove call stack. In other case we have to 
        // update all call stack indexes
        //
        if (fCount === -1) {fCount = this.fCount}
        if (this.fCount !== fCount) {this.stackIndex = -1}
        else {
            const stk = this.stack;
            for (let i = 0, len = this.stackIndex + 1; i <= len; i++) {
                const ln = stk[i];                                      // Updates back line
                if (ln > index2) {stk[i] += amount}
                else if (ln >= index1 && ln <= index2) {stk[i] = index1}
            }
        }
        //
        // Updates loop metadata (after loop lines indexes)
        //
        const loops   = this.loops;
        const newLoop = {};
        for (let l in loops) {
            if (loops.hasOwnProperty(l)) {
                l = +l;
                const iterations = loops[l];
                if (l > index2) {newLoop[l + amount] = iterations}
                else if (l >= index1 && l <= index2) {newLoop[index1] = iterations}
                else {newLoop[l] = iterations}
            }
        }
        this.loops = newLoop;
    }

    /**
     * Does a compilation and calls updateMetadata(). This is usefull for cases of
     * dynamic code change, when one block is moved inside the code. e.g. molecule
     * moving or anabolism. First indexes are for compile() method, second for 
     * updateMetadata()
     * @param {*} index11 
     * @param {*} index12 
     * @param {*} dir1 
     * @param {*} index21 
     * @param {*} index22 
     * @param {*} dir2 
     */
    compileMove(index11 = 0, index12 = 0, dir1 = 1, index21 = 0, index22 = 0, dir2 = 1) {
        this.compile(index11, index12, dir1);
        this.updateMetadata(index21, index22, dir2);
    }
}

module.exports = Organism;