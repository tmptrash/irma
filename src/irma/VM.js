/**
 * Virtual Machine (VM) class. Runs "line" scripts. Switches between them,
 * works with registers and understands all available commands. Simulates
 * multithreading using coroutines technique. This class understands only
 * basic commands. To extend it, use class extension.
 *
 * @author flatline
 */
const Config            = require('./../Config');
const FastArray         = require('./../common/FastArray');
const Helper            = require('./../common/Helper');
const Plugins           = require('../common/Plugins');
const Organism          = require('./Organism');
const Mutations         = require('./Mutations');
const PLUGINS           = Helper.requirePlugins(Config.PLUGINS);
const rand              = Helper.rand;

const CODE_CMD_OFFS     = Config.CODE_CMD_OFFS;
const CODE_MAX_RAND     = CODE_CMD_OFFS + Config.CODE_COMMANDS;
const CODE_STACK_SIZE   = Config.CODE_STACK_SIZE;
const RET_OK            = Config.CODE_RET_OK;
const RET_ERR           = Config.CODE_RET_ERR;

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
                let   code = org.code;
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
                    const cmd = code[line];

                    switch (cmd) {
                        case CODE_CMD_OFFS: {    // toggle
                            ++line;
                            const tmp = ax;
                            ax = bx;
                            bx = tmp;
                            continue;
                        }

                        case CODE_CMD_OFFS + 1:  // shift
                            ++line;
                            org.ax = ax;
                            org.bx = bx;
                            org.shift();
                            ax = org.ax;
                            bx = org.bx;
                            continue;

                        case CODE_CMD_OFFS + 2:  // eq
                            ++line;
                            ax = bx;
                            continue;

                        case CODE_CMD_OFFS + 3:  // nop
                            ++line;
                            continue;

                        case CODE_CMD_OFFS + 4:  // add
                            ++line;
                            ax += bx;
                            if (Number.isFinite(ax)) {continue}
                            ax = Number.MAX_VALUE;
                            continue;

                        case CODE_CMD_OFFS + 5:  // sub
                            ++line;
                            ax -= bx;
                            if (Number.isFinite(ax)) {continue}
                            ax = -Number.MAX_VALUE;
                            continue;

                        case CODE_CMD_OFFS + 6:  // mul
                            ++line;
                            ax *= bx;
                            if (Number.isFinite(ax)) {continue}
                            ax = Number.MAX_VALUE;
                            continue;

                        case CODE_CMD_OFFS + 7:  // div
                            ++line;
                            ax = Math.round(ax / bx);
                            if (Number.isFinite(ax)) {continue}
                            ax = -Number.MAX_VALUE;
                            continue;

                        case CODE_CMD_OFFS + 8: // inc
                            ++line;
                            ax++;
                            if (Number.isFinite(ax)) {continue}
                            ax = Number.MAX_VALUE;
                            continue;

                        case CODE_CMD_OFFS + 9:  // dec
                            ++line;
                            ax--;
                            if (Number.isFinite(ax)) {continue}
                            ax = -Number.MAX_VALUE;
                            continue;

                        case CODE_CMD_OFFS + 10:  // rshift
                            ++line;
                            ax >>= 1;
                            continue;

                        case CODE_CMD_OFFS + 11:  // lshift
                            ++line;
                            ax <<= 1;
                            continue;

                        case CODE_CMD_OFFS + 12:  // rand
                            ++line;
                            ax = ax < 0 ? rand(CODE_MAX_RAND * 2) - CODE_MAX_RAND : rand(ax);
                            continue;

                        case CODE_CMD_OFFS + 13:  // ifp
                            line = ax > 0 ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 14:  // ifn
                            line = ax < 0 ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 15:  // ifz
                            line = ax === 0 ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 16:  // ifg
                            line = ax > bx ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 17:  // ifl
                            line = ax < bx ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 18:  // ife
                            line = ax === bx ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 19:  // ifne
                            line = ax !== bx ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 20: {// loop
                            const loops = org.loops;
                            //
                            // previous line was "end", so this is next iteration cicle
                            //
                            if (!org.isLoop) {loops[line] = -1}
                            org.isLoop = false;
                            if (loops[line] < 0 && org.offs[line] > line + 1) {
                                loops[line] = ax;
                            }
                            if (--loops[line] < 0) {
                                line = org.offs[line];
                                continue;
                            }
                            ++line;
                            continue;
                        }

                        case CODE_CMD_OFFS + 21: {// call
                            if (org.fCount === 0) {++line; continue}
                            let index = org.stackIndex;
                            if (index >= CODE_STACK_SIZE * 3) {index = -1}
                            const func     = Math.abs(ax) % org.fCount;
                            const stack    = org.stack;
                            const newLine  = org.funcs[func];
                            if (org.offs[newLine - 1] === newLine) {++line; continue}
                            stack[++index] = line + 1;
                            stack[++index] = ax;
                            stack[++index] = bx;
                            line = newLine;
                            org.stackIndex = index;
                            continue;
                        }

                        case CODE_CMD_OFFS + 22:   // func
                            line = org.offs[line];
                            if (line === 0 && org.stackIndex >= 0) {
                                const stack = org.stack;
                                bx   = stack[2];
                                ax   = stack[1];
                                line = stack[0];
                                org.stackIndex = -1;
                            }
                            continue;

                        case CODE_CMD_OFFS + 23: {// ret
                            const stack = org.stack;
                            let index = org.stackIndex;
                            if (index < 0) {line = 0; continue}
                            bx   = stack[index--];
                            ax   = stack[index--];
                            line = stack[index--];
                            org.stackIndex = index;
                            continue;
                        }

                        case CODE_CMD_OFFS + 24:  // end
                            switch (code[org.offs[line]]) {
                                case CODE_CMD_OFFS + 22: // loop
                                    line = org.offs[line];
                                    org.isLoop = true;
                                    break;
                                case CODE_CMD_OFFS + 24: // func
                                    const stack = org.stack;
                                    let index = org.stackIndex;
                                    if (index < 0) {break}
                                    bx   = stack[index--];
                                    ax   = stack[index--];
                                    line = stack[index--];
                                    org.stackIndex = index;
                                    break;
                                default:
                                    ++line;
                                    break;
                            }
                            continue;

                        case CODE_CMD_OFFS + 25:  // retax
                            ++line;
                            ax = org.ret;
                            continue;

                        case CODE_CMD_OFFS + 26:  // axret
                            ++line;
                            org.ret = ax;
                            continue;

                        case CODE_CMD_OFFS + 27:  // and
                            ++line;
                            ax &= bx;
                            continue;

                        case CODE_CMD_OFFS + 28:  // or
                            ++line;
                            ax |= bx;
                            continue;

                        case CODE_CMD_OFFS + 29:  // xor
                            ++line;
                            ax ^= bx;
                            continue;

                        case CODE_CMD_OFFS + 30:  // not
                            ++line;
                            ax = ~ax;
                            continue;

                        case CODE_CMD_OFFS + 31:  // find
                            ++line;
                            if (bx < 0) {
                                let   f0    = org.find0;
                                let   f1    = org.find1;
                                if (f1 < f0) {org.ret = RET_ERR; continue}
                                
                                const index = code.findIndex((c, i) => {
                                    if (i < f0 || i > f1) {return -1}
                                    return ax === c;
                                });
                                if (index === -1) {
                                    org.ret = RET_ERR;
                                } else {
                                    org.find0 = org.find1 = ax = index;
                                    org.ret = RET_OK;
                                }
                            } else {
                                if (bx > ax || ax > code.length || bx > code.length) {org.ret = RET_ERR; continue}
                                const len2 = bx - ax;
                                const len1 = code.length - (len2 + 1);
                                let   ret  = RET_ERR;
                                let   j;
                                loop: for (let i = org.ret < 0 ? 0 : org.ret; i < len1; i++) {
                                    for (j = ax; j <= bx; j++) {
                                        if (code[i + j - ax] !== code[j]) {continue loop}
                                    }
                                    org.find0 = ax = i;
                                    org.find1 = i + len2;
                                    ret = RET_OK;
                                    break;
                                }
                                org.ret = ret;
                            }
                            continue;

                        case CODE_CMD_OFFS + 32: {// move
                            ++line;
                            const find0    = org.find0;
                            const find1    = org.find1;
                            if (find1 < find0) {org.ret = RET_ERR; continue}
                            const moveCode = code.slice(find0, find1 + 1);
                            if (moveCode.length < 1) {org.ret = RET_ERR; continue}
                            const newAx    = ax < 0 ? 0 : (ax > code.length ? code.length : ax);
                            const len      = find1 - find0 + 1;
                            const offs     = newAx > find1 ? newAx - len : (newAx < find0 ? newAx : find0);
                            if (find0 === offs) {org.ret = RET_OK; continue}
                            code = code.splice(find0, len);
                            org.code = code = code.splice(offs, 0, moveCode);
                            //
                            // Important: moving new commands insie the script may break it, because it's
                            // offsets, stack and context may be invalid. Generally, we have to compile
                            // it after move. But this process resets stack and current running script line
                            // to zero line and script start running from the beginning. To fix this we 
                            // just assume that moving command doesn't belong to main (replicator) script
                            // part and skip compile. So, next line should not be uncommented
                            // org.compile();
                            // line = 0;
                            //
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 33:  // age
                            ++line;
                            ax = org.age;
                            continue;

                        case CODE_CMD_OFFS + 34:  // line
                            ax = line++;
                            continue;

                        case CODE_CMD_OFFS + 35:  // len
                            line++;
                            ax = code.length;
                            continue;

                        case CODE_CMD_OFFS + 36:  // left
                            line++;
                            if (--org.pos < 0) {org.pos = org.mem.length - 1}
                            continue;

                        case CODE_CMD_OFFS + 37:  // right
                            line++;
                            if (++org.pos === org.mem.length) {org.pos = 0}
                            continue;

                        case CODE_CMD_OFFS + 38:  // save
                            line++;
                            org.mem[org.pos] = ax;
                            continue;

                        case CODE_CMD_OFFS + 39:  // load
                            line++;
                            ax = org.mem[org.pos];
                            continue;

                        case CODE_CMD_OFFS + 40:  // limit
                            line++;
                            org.find0 = ax;
                            org.find1 = bx;
                            continue;
                    }
                    //
                    // This is a constant
                    //
                    if (cmd < CODE_CMD_OFFS && cmd > -CODE_CMD_OFFS) {ax = cmd; ++line; continue}
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
                        // Current command is not from standart list. Call child class to handle it
                        //
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