/**
 * Virtual Machine (VM) class. Runs "line" scripts. Switches between them,
 * works with registers and understands all available commands. Simulates
 * multithreading using coroutines technique. This class understands only
 * basic commands. To extend it, use class extension.
 *
 * @author flatline
 */
const Config                = require('./../Config');
const FastArray             = require('./../common/FastArray');
const Helper                = require('./../common/Helper');
const Plugins               = require('../common/Plugins');
const Organism              = require('./Organism');
const Mutations             = require('./Mutations');

const PLUGINS               = Helper.requirePlugins(Config.PLUGINS);
const rand                  = Helper.rand;

const CODE_CMD_OFFS         = Config.CODE_CMD_OFFS;
const CODE_STACK_SIZE       = Config.CODE_STACK_SIZE;
const CODE_8_BIT_RESET_MASK = Config.CODE_8_BIT_RESET_MASK;
//
// Basic commands
//
const TOGGLE = Config.CODE_CMDS.TOGGLE;
const EQ     = Config.CODE_CMDS.EQ;
const NOP    = Config.CODE_CMDS.NOP;
const ADD    = Config.CODE_CMDS.ADD;
const SUB    = Config.CODE_CMDS.SUB;
const MUL    = Config.CODE_CMDS.MUL;
const DIV    = Config.CODE_CMDS.DIV;
const INC    = Config.CODE_CMDS.INC;
const DEC    = Config.CODE_CMDS.DEC;
const RSHIFT = Config.CODE_CMDS.RSHIFT;
const LSHIFT = Config.CODE_CMDS.LSHIFT;
const RAND   = Config.CODE_CMDS.RAND;
const IFP    = Config.CODE_CMDS.IFP;
const IFN    = Config.CODE_CMDS.IFN;
const IFZ    = Config.CODE_CMDS.IFZ;
const IFG    = Config.CODE_CMDS.IFG;
const IFL    = Config.CODE_CMDS.IFL;
const IFE    = Config.CODE_CMDS.IFE;
const IFNE   = Config.CODE_CMDS.IFNE;
const LOOP   = Config.CODE_CMDS.LOOP;
const CALL   = Config.CODE_CMDS.CALL;
const FUNC   = Config.CODE_CMDS.FUNC;
const RET    = Config.CODE_CMDS.RET;
const END    = Config.CODE_CMDS.END;
const RETAX  = Config.CODE_CMDS.RETAX;
const AXRET  = Config.CODE_CMDS.AXRET;
const AND    = Config.CODE_CMDS.AND;
const OR     = Config.CODE_CMDS.OR;
const XOR    = Config.CODE_CMDS.XOR;
const NOT    = Config.CODE_CMDS.NOT;
const AGE    = Config.CODE_CMDS.AGE;
const LINE   = Config.CODE_CMDS.LINE;
const LEN    = Config.CODE_CMDS.LEN;
const LEFT   = Config.CODE_CMDS.LEFT;
const RIGHT  = Config.CODE_CMDS.RIGHT;
const SAVE   = Config.CODE_CMDS.SAVE;
const LOAD   = Config.CODE_CMDS.LOAD;

class VM {
    /**
     * Is called before every organism iteration
     * @param {Organism} org
     * @interface
     */
    beforeIteration() {}

    /**
     * Is called after organism iteration
     * @param {Organism} org
     * @interface
     */
    afterIteration() {}

    /**
     * Is called after every repeat
     * @interface
     */
    afterRepeat() {}

    /**
     * Is called at the end of run() method to do post processing
     * @interface
     */
    afterRun() {}

    /**
     * Should be overridden in child class to support other commands. For
     * example biological stuff
     * @param {Organism} org Current organism
     * @param {Number} cmd Command to run
     * @interface
     */
    runCmd() {}

    /**
     * Creates and initializes VM instance and it's plugins
     * @param {Number} amount Amount of organisms
     */
    constructor(amount) {
        this.orgs       = new FastArray(amount);
        this.population = 0;
        this.iteration  = 0;
        this.plugins    = new Plugins(PLUGINS, this);
    }

    /**
     * Destroys VM instance and all inner stuff. 
     * this.plugins will be destroyed automatically
     */
    destroy() {
        this.orgs.destroy();
        this.orgs = null;
    }

    /**
     * Runs code of all organisms Config.codeRepeatsPerRun time and return. Big
     * Config.codeRepeatsPerRun value may slow down user and browser interaction
     */
    run() {
        const repeats          = Config.codeRepeatsPerRun;
        const lines            = Config.codeLinesPerIteration;
        const mutationPeriod   = Config.orgMutationPeriod;
        const orgs             = this.orgs;
        const orgsRef          = orgs.ref();
        //
        // Loop X times through population
        //
        for (let r = 0; r < repeats; r++) {
            //
            // Loop through population
            //
            let o = orgs.items;
            while (--o > -1) {
                const org  = orgsRef[o];
                const code = org.code;
                let   ax   = org.ax;
                let   bx   = org.bx;
                let   line = org.line;
                //
                // Is called once before every organism iteration
                //
                this.beforeIteration(org);
                //
                // Loop through few lines in one organism to
                // support pseudo multi threading
                //
                for (let l = 0; l < lines; l++) {
                    const cmd = code[line] & CODE_8_BIT_RESET_MASK;

                    // eslint-disable-next-line default-case
                    switch (cmd) {
                        case TOGGLE: {
                            ++line;
                            ax ^= bx;
                            bx ^= ax;
                            ax ^= bx;
                            continue;
                        }

                        case EQ:
                            ++line;
                            ax = bx;
                            continue;

                        case NOP:
                            ++line;
                            continue;

                        case ADD:
                            ++line;
                            ax += bx; 
                            if (Number.isFinite(ax)) {continue}
                            ax = Number.MAX_VALUE;
                            continue;

                        case SUB:
                            ++line;
                            ax -= bx;
                            if (Number.isFinite(ax)) {continue}
                            ax = -Number.MAX_VALUE;
                            continue;

                        case MUL:
                            ++line;
                            ax *= bx;
                            if (Number.isFinite(ax)) {continue}
                            ax = Number.MAX_VALUE;
                            continue;

                        case DIV:
                            ++line;
                            ax = Math.round(ax / bx);
                            if (Number.isFinite(ax)) {continue}
                            ax = -Number.MAX_VALUE;
                            continue;

                        case INC:
                            ++line;
                            ax++;
                            if (Number.isFinite(ax)) {continue}
                            ax = Number.MAX_VALUE;
                            continue;

                        case DEC:
                            ++line;
                            ax--;
                            if (Number.isFinite(ax)) {continue}
                            ax = -Number.MAX_VALUE;
                            continue;

                        case RSHIFT:
                            ++line;
                            ax >>= 1;
                            continue;

                        case LSHIFT:
                            ++line;
                            ax <<= 1;
                            continue;

                        case RAND:
                            ++line;
                            ax = ax < 1 ? rand(256) : rand(ax);
                            continue;

                        case IFP:
                            line = ax > 0 ? line + 1 : (org.offs[line] || 0);
                            continue;

                        case IFN:
                            line = ax < 0 ? line + 1 : (org.offs[line] || 0);
                            continue;

                        case IFZ:
                            line = ax === 0 ? line + 1 : (org.offs[line] || 0);
                            continue;

                        case IFG:
                            line = ax > bx ? line + 1 : (org.offs[line] || 0);
                            continue;

                        case IFL:
                            line = ax < bx ? line + 1 : (org.offs[line] || 0);
                            continue;

                        case IFE:
                            line = ax === bx ? line + 1 : (org.offs[line] || 0);
                            continue;

                        case IFNE:
                            line = ax !== bx ? line + 1 : (org.offs[line] || 0);
                            continue;

                        case LOOP: {
                            const loops = org.loops;
                            //
                            // previous line was "end", so this is next iteration cicle
                            //
                            if (!org.isLoop) {delete loops[line]}
                            org.isLoop = false;
                            if (loops[line] === undefined && (org.offs[line] || 0) > line + 1) {
                                loops[line] = ax;
                            }
                            if (--loops[line] < 0) {
                                line = (org.offs[line] || 0);
                                continue;
                            }
                            ++line;
                            continue;
                        }

                        case CALL: {
                            if (org.fCount === 0) {++line; continue}
                            let index = org.stackIndex;
                            if (index >= CODE_STACK_SIZE * 3) {index = -1}
                            const func     = Math.abs(ax) % org.fCount;
                            const stack    = org.stack;
                            const newLine  = org.funcs[func] || 0;
                            if ((org.offs[newLine - 1] || 0) === newLine) {++line; continue}
                            stack[++index] = line + 1;
                            stack[++index] = ax;
                            stack[++index] = bx;
                            line = newLine;
                            org.stackIndex = index;
                            continue;
                        }

                        case FUNC:
                            line = (org.offs[line] || 0);
                            if (line === 0 && org.stackIndex >= 0) {
                                const stack = org.stack;
                                bx   = stack[2];
                                ax   = stack[1];
                                line = stack[0];
                                org.stackIndex = -1;
                            }
                            continue;

                        case RET: {
                            const stack = org.stack;
                            let index = org.stackIndex;
                            if (index < 0) {line = 0; continue}
                            bx   = stack[index--];
                            ax   = stack[index--];
                            line = stack[index--];
                            org.stackIndex = index;
                            continue;
                        }

                        case END:
                            switch (code[org.offs[line] || 0] & CODE_8_BIT_RESET_MASK) {
                                case LOOP:
                                    line = org.offs[line] || 0;
                                    org.isLoop = true;
                                    break;
                                case FUNC: {
                                    const stack = org.stack;
                                    let index = org.stackIndex;
                                    if (index < 0) {break}
                                    bx   = stack[index--];
                                    ax   = stack[index--];
                                    line = stack[index--];
                                    org.stackIndex = index;
                                    break;
                                }
                                default:
                                    ++line;
                                    break;
                            }
                            continue;

                        case RETAX:
                            ++line;
                            ax = org.ret;
                            continue;

                        case AXRET:
                            ++line;
                            org.ret = ax;
                            continue;

                        case AND:
                            ++line;
                            ax &= bx;
                            continue;

                        case OR:
                            ++line;
                            ax |= bx;
                            continue;

                        case XOR:
                            ++line;
                            ax ^= bx;
                            continue;

                        case NOT:
                            ++line;
                            ax = ~ax;
                            continue;

                        case AGE:
                            ++line;
                            ax = org.age;
                            continue;

                        case LINE:
                            ax = line++;
                            continue;

                        case LEN:
                            line++;
                            ax = code.length;
                            continue;

                        case LEFT:
                            line++;
                            if (--org.memPos < 0) {org.memPos = org.mem.length - 1}
                            continue;

                        case RIGHT:
                            line++;
                            if (++org.memPos === org.mem.length) {org.memPos = 0}
                            continue;

                        case SAVE:
                            line++;
                            org.mem[org.memPos] = ax;
                            continue;

                        case LOAD:
                            line++;
                            ax = org.mem[org.memPos];
                            continue;
                    }
                    //
                    // We are on the last code line. Have to jump to the first
                    //
                    if (line >= code.length) {
                        if (org.stackIndex >= 0) {
                            const stack = org.stack;
                            bx   = stack[2];
                            ax   = stack[1];
                            line = stack[0];
                            org.stackIndex = -1;
                        } else {
                            line = 0;
                        }
                    } else {
                        //
                        // This is a constant. This check must be after line >= code.length, because
                        // if we step outside of the script cmd will be less then CODE_CMD_OFFS. This
                        // script will not work in this case: [1,ifl,2,end]. Because ifl steps out of
                        // script and cmd will be 0 (but should be undefined)
                        //
                        if (cmd < CODE_CMD_OFFS) {ax = cmd; ++line; continue}
                        //
                        // Current command is not from standart list. Call child class to handle it
                        // TODO: this code doesn't look optimized to me
                        org.line = line;
                        org.ax   = ax;
                        org.bx   = bx;
                        this.runCmd(org, cmd);
                        line     = org.line;
                        ax       = org.ax;
                        bx       = org.bx;
                    }
                }
                org.line = line;
                org.ax   = ax;
                org.bx   = bx;
                //
                // Cosmic ray mutations
                //
                if (org.age % org.period === 0 && mutationPeriod > 0) {Mutations.mutate(org)}
                this.afterIteration(org);
                //
                // Age should be changed every iteration
                //
                org.age++;
            }
            this.afterRepeat();
            this.iteration++;
        }
        this.afterRun();
    }

    /**
     * Creates one organism with default parameters and specified code
     * @param {Number} index Index in population list
     * @param {Uint8Array} code Code to set
     * @param {Boolean} simple simple organism or not
     * @return {Organism} Created organism
     */
    addOrg(index, code = null, simple = false) {
        const org = new Organism(index, code, simple);
        !simple && this.orgs.add(org);
        return org;
    }

    /**
     * Removes organism from the world totally
     * @param {Organism} org Organism to remove
     */
    delOrg(org) {
        this._delFromOrgArr(org.index);
    }

    /**
     * Removes organism from population list
     * @param {Number} index Organism index in a population list
     */
    _delFromOrgArr(index) {
        const orgs = this.orgs;
        orgs.del(index);
        index < orgs.items && (orgs.get(index).index = index);
    }
}

module.exports = VM;