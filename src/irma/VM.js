/**
 * TODO: update this...
 * Supported commands:
 *   CODE_CMD_OFFS + 0  - toggle - switches active register between ax and bx
 *   CODE_CMD_OFFS + 0  - step   - moves organism using d (one of 8) direction
 *   CODE_CMD_OFFS + 1  - eat    - eats something using d (one of 8) direction, ate energy will be in b
 *   CODE_CMD_OFFS + 2  - clone  - clones himself using d (one of 8) direction, 0|1 will be in b
 *   CODE_CMD_OFFS + 3  - see    - see in point: (offs), dot will be in d
 *   CODE_CMD_OFFS + 4  - dtoa   - copy value from d to a
 *   CODE_CMD_OFFS + 5  - dtob   - copy value from d to b
 *   CODE_CMD_OFFS + 6  - atod   - copy value from a to d
 *   CODE_CMD_OFFS + 7  - btod   - copy value from b to d
 *   CODE_CMD_OFFS + 8  - add    - d = a + b
 *   CODE_CMD_OFFS + 9  - sub    - d = a - b
 *   CODE_CMD_OFFS + 10 - mul    - d = a * b
 *   CODE_CMD_OFFS + 11 - div    - d = a / b
 *   CODE_CMD_OFFS + 12 - inc    - d++
 *   CODE_CMD_OFFS + 13 - dec    - d--
 *   CODE_CMD_OFFS + 14 - loop   - loop d times till end or skip
 *   CODE_CMD_OFFS + 15 - ifdgb  - if d > a
 *   CODE_CMD_OFFS + 16 - ifdla  - if d < a
 *   CODE_CMD_OFFS + 17 - ifdea  - if d == a
 *   CODE_CMD_OFFS + 18 - nop    - no operation
 *   CODE_CMD_OFFS + 19 - mget   - a = mem[d]
 *   CODE_CMD_OFFS + 20 - mput   - mem[d] = a
 *   CODE_CMD_OFFS + 21 - offs   - d = org.offset
 *   CODE_CMD_OFFS + 22 - rand   - d = rand(-CODE_CMD_OFFS..CODE_CMD_OFFS)
 *   CODE_CMD_OFFS + 23 - call   - calls function with name/index d % funcAmount
 *   CODE_CMD_OFFS + 24 - func   - function begin operator
 *   CODE_CMD_OFFS + 25 - ret    - returns from function. d will be return value
 *   CODE_CMD_OFFS + 26 - end    - function/ifxxx finish operator. no return value
 *   CODE_CMD_OFFS + 27 - get    - get object using d (one of 8) direction, get object will be in b
 *   CODE_CMD_OFFS + 28 - put    - put object using d (one of 8) direction, put object will be in b
 *   CODE_CMD_OFFS + 29 - mix    - mix near object and one from d (one of 8) direction into new one, mix will be in b
 *
 * @author flatline
 */
const Config    = require('./../Config');
const FastArray = require('./../common/FastArray');
const Helper    = require('./../common/Helper');
const Db        = require('./../common/Db');
const Organism  = require('./Organism');
const Mutations = require('./Mutations');
const World     = require('./World');
const Elements  = require('./Elements');
/**
 * {Number} This value very important. This is amount of total energy in a world
 * (organisms + energy). This value organisms must not exceed. This is how we
 * create a lack of resources in a world.
 */
const MAX_ENERGY        = (Config.orgCloneEnergy - 1) * (Config.orgAmount >> 1);
/**
 * {Number} This offset will be added to commands value. This is how we
 * add an ability to use numbers in a code, just putting them as command
 */
const CODE_CMD_OFFS     = Config.CODE_CMD_OFFS;
/**
 * {Number} Maximum random generated value
 */
const CODE_MAX_RAND     = CODE_CMD_OFFS + Config.CODE_COMMANDS;
const CODE_STACK_SIZE   = Config.CODE_STACK_SIZE;
/**
 * {Array} Array of increments. Using it we may obtain coordinates of the
 * point depending on one of 8 directions. We use these values in any command
 * related to sight, moving and so on
 */
const DIR               = Config.DIR;
/**
 * {Number} World size. Pay attention, that width and height is -1
 */
const WIDTH             = Config.WORLD_WIDTH - 1;
const HEIGHT            = Config.WORLD_HEIGHT - 1;
const WIDTH1            = WIDTH + 1;
const HEIGHT1           = HEIGHT + 1;
const MAX_OFFS          = WIDTH1 * HEIGHT1 - 1;
const MAX               = Number.MAX_VALUE;
const MIN               = Number.MIN_VALUE;

const ORG_MASK          = Config.ORG_MASK;
const ORG_INDEX_MASK    = 0x7fffffff;
const ORG_ATOM_MASK     = 0x000000f0;
const ORG_CODE_MAX_SIZE = Config.orgMaxCodeSize;

const ENERGY_OFF_MASK   = 0xffffff0f;
/**
 * {Number} Max amount of supported surfaces
 */
const SURFACES          = 16;

const ceil              = Math.ceil;
const round             = Math.round;
const rand              = Helper.rand;
const fin               = Number.isFinite;
const abs               = Math.abs;
const nan               = Number.isNaN;

class VM {
    constructor() {
        this.totalOrgsEnergy  = 0;
        this._world           = new World();
        this._elements        = new Elements(this._world);
        this._orgs            = null;
        this._iterations      = 0;
        this._population      = 0;
        this._ts              = Date.now();
        this._i               = 0;
        this._r               = 0;
        this._freq            = {};
        this._diff            = 0;
        this._averageDistance = 0;
        this._averageCodeSize = 0;
        this._averageAmount   = 0;
        if (Config.DB_ON) {
            this._db          = new Db();
            this._db.ready.then(() => this._createOrgs());
        } else {this._createOrgs()}
    }

    destroy() {
        this._world.destroy();
        this._orgs.destroy();
        this._db && this._db.destroy();
        this._elements.destroy();
        this._elements = null;
        this._world    = null;
        this._orgs     = null;
        this._orgs     = null;
        this._db       = null;
    }

    get ready() {
        if (this._db) {
            return this._db.ready;
        }
        return new Promise(resolve => resolve());
    }

    /**
     * Runs code of all organisms Config.codeTimesPerRun time and return. Big
     * times value may slow down user and browser interaction
     */
    run() {
        const times            = Config.codeTimesPerRun;
        const lines            = Config.codeLinesPerIteration;
        const world            = this._world;
        const data             = world.data;
        const maxCodeSize      = Config.orgMaxCodeSize;
        const mutationPeriod   = Config.orgMutationPeriod;
        const maxAge           = Config.orgMaxAge;
        const energyPeriod     = Config.orgEnergyPeriod;
        const cataclysmPeriod  = Config.worldCataclysmEvery;
        const orgs             = this._orgs;
        const orgsRef          = this._orgs.getRef();
        const orgAmount        = Config.orgAmount;
        //
        // Loop X times through population
        //
        for (let time = 0; time < times; time++) {
            //
            // Loop through population
            //
            let orgsEnergy = 0;
            let o = orgs.first;
            while (o < orgAmount) {
                const org  = orgsRef[o++];
                const code = org.code;
                let   ax   = org.ax;
                let   bx   = org.bx;
                let   line = org.line;
                let   tmp;
                //
                // Resets value of 'say' command
                //
                if (org.freq) {org.freq = this._freq[org.freq] = 0}
                //
                // Loop through few lines in one organism to
                // support pseudo multi threading
                //
                for (let l = 0; l < lines; l++) {
                    const cmd = code[line];

                    switch (cmd) {
                        case CODE_CMD_OFFS:      // toggle
                            tmp = ax;
                            ax  = bx;
                            bx  = tmp;
                            ++line;
                            continue;

                        case CODE_CMD_OFFS + 1:  // shift
                            org.shift();
                            ax  = org.ax;
                            bx  = org.bx;
                            ++line;
                            continue;

                        case CODE_CMD_OFFS + 2:  // eq
                            ax = bx;
                            ++line;
                            continue;

                        case CODE_CMD_OFFS + 3:  // pop
                            ax = org.pop();
                            ++line;
                            continue;

                        case CODE_CMD_OFFS + 4:  // push
                            org.push(ax);
                            ++line;
                            continue;

                        case CODE_CMD_OFFS + 5:  // nop
                            ++line;
                            continue;

                        case CODE_CMD_OFFS + 6:  // add
                            ++line;
                            ax += bx;
                            if (!fin(ax)) {ax = MAX}
                            continue;

                        case CODE_CMD_OFFS + 7:  // sub
                            ++line;
                            ax -= bx;
                            if (!fin(ax)) {ax = MIN}
                            continue;

                        case CODE_CMD_OFFS + 8:  // mul
                            ++line;
                            ax *= bx;
                            if (!fin(ax)) {ax = MAX}
                            continue;

                        case CODE_CMD_OFFS + 9:  // div
                            ++line;
                            ax = Math.round(ax / bx);
                            if (!fin(ax)) {ax = MIN}
                            continue;

                        case CODE_CMD_OFFS + 10: // inc
                            ++line;
                            ax++;
                            if (!fin(ax)) {ax = MAX}
                            continue;

                        case CODE_CMD_OFFS + 11:  // dec
                            ++line;
                            ax--;
                            if (!fin(ax)) {ax = MIN}
                            continue;

                        case CODE_CMD_OFFS + 12:  // rshift
                            ++line;
                            ax >>= 1;
                            continue;

                        case CODE_CMD_OFFS + 13:  // lshift
                            ++line;
                            ax <<= 1;
                            continue;

                        case CODE_CMD_OFFS + 14:  // rand
                            ++line;
                            ax = rand(CODE_MAX_RAND * 2) - CODE_MAX_RAND;
                            continue;

                        case CODE_CMD_OFFS + 15:  // ifp
                            line = ax > 0 ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 16:  // ifn
                            line = ax < 0 ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 17:  // ifz
                            line = ax === 0 ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 18:  // ifg
                            line = ax > bx ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 19:  // ifl
                            line = ax < bx ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 20:  // ife
                            line = ax === bx ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 21:  // ifne
                            line = ax !== bx ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 22: {// loop
                            const LOOPS = org.loops;
                            if (LOOPS[line] < 0 && org.offs[line] > line + 1) {
                                LOOPS[line] = ax;
                            }
                            if (--LOOPS[line] < 0) {
                                line = org.offs[line];
                                continue;
                            }
                            ++line;
                            continue;
                        }

                        case CODE_CMD_OFFS + 23: {// call
                            if (org.fCount === 0) {++line; continue}
                            let index = org.stackIndex;
                            if (index >= CODE_STACK_SIZE * 4) {index = -1}
                            const func = abs(ax) % org.fCount;
                            const stack = org.stack;
                            stack[++index] = line + 1;
                            stack[++index] = ax;
                            stack[++index] = bx;
                            line = org.funcs[func];
                            org.stackIndex = index;
                            continue;
                        }

                        case CODE_CMD_OFFS + 24: { // func
                            line = org.offs[line];
                            if (line === 0 && org.stackIndex >= 0) {
                                const stack = org.stack;
                                bx   = stack[2];
                                ax   = stack[1];
                                line = stack[0];
                                org.stackIndex = -1;
                            }
                            continue;
                        }

                        case CODE_CMD_OFFS + 25: {// ret
                            const stack = org.stack;
                            let index = org.stackIndex;
                            if (index < 0) {++line; continue}
                            line = stack[index--];
                            bx   = stack[index--];
                            ax   = stack[index--];
                            org.stackIndex = index;
                            continue;
                        }

                        case CODE_CMD_OFFS + 26: {// end
                            switch (code[org.offs[line]]) {
                                case CODE_CMD_OFFS + 21: // loop
                                    line = org.offs[line];
                                    break;
                                case CODE_CMD_OFFS + 23: // func
                                    const stack = org.stack;
                                    let index = org.stackIndex;
                                    if (index < 0) {break}
                                    line = stack[index--];
                                    bx   = stack[index--];
                                    ax   = stack[index--];
                                    org.stackIndex = index;
                                    break;
                                default:
                                    ++line;
                                    break;
                            }
                            continue;
                        }

                        case CODE_CMD_OFFS + 27: {// retax
                            ax = this._r;
                            ++line;
                            continue;
                        }

                        case CODE_CMD_OFFS + 28: {// axret
                            this._r = ax;
                            ++line;
                            continue;
                        }

                        case CODE_CMD_OFFS + 29: {// and
                            ax &= bx;
                            ++line;
                            continue;
                        }

                        case CODE_CMD_OFFS + 30: {// or
                            ax |= bx;
                            ++line;
                            continue;
                        }

                        case CODE_CMD_OFFS + 31: {// xor
                            ax ^= bx;
                            ++line;
                            continue;
                        }

                        case CODE_CMD_OFFS + 32: {// not
                            ax = ~ax;
                            ++line;
                            continue;
                        }

                        case CODE_CMD_OFFS + 33: {// join
                            ++line;
                            const offset = org.offset + DIR[abs(ax) % 8];
                            const dot    = data[offset];
                            if (!dot) {this._r = 0; continue}
                            const nearOrg = orgsRef[dot & ORG_INDEX_MASK];
                            if (nearOrg.code.length + code.length > ORG_CODE_MAX_SIZE) {this._r = 0; continue}
                            code.splice(bx >= code.length ? code.length : bx, 0, ...nearOrg.code);
                            world.empty(offset);
                            this._r = 1;
                            continue;
                        }

                        case CODE_CMD_OFFS + 34: {// split
                            ++line;
                            const dot = data[org.offset + this._r];
                            if (!dot) {this._r = 0; continue} // organism on the right
                            if (ax < 0 || ax > code.length || bx <= ax) {this._r = 0; continue}
                            const newCode = code.splice(ax, bx - ax);
                            const clone   = this._createOrg(org.offset + this._r, org, newCode);
                            this._db && this._db.put(clone, org);
                            this._r = 1;
                            continue;
                        }

                        case CODE_CMD_OFFS + 35: {// step
                            ++line;
                            if (++org.steps < org.moves) {continue}
                            org.steps = 0;
                            const offset = org.offset + DIR[abs(ax) % 8];
                            if (data[offset] !== 0) {continue}
                            world.moveOrg(org, offset);
                            continue;
                        }

                        case CODE_CMD_OFFS + 36: {// find
                            ++line;
                            if (bx < 0) {
                                const index = code.indexOf(ax);
                                if (index === -1) {
                                    this._r = 0;
                                } else {
                                    this._r = 1;
                                    org.find0 = org.find1 = ax = index;
                                }
                            } else {
                                if (bx > ax) {this._r = 0; continue}
                                const len2 = bx - ax;
                                const len1 = code.length - len2;
                                let   j;
                                this._r = 0;
                                loop: for (let i = this._r; i < len1; i++) {
                                    for (j = 0; j < len2; j++) {
                                        if (code[i + j] !== code[i]) {break loop}
                                    }
                                    org.find0 = ax = i + j;
                                    org.find1 = org.find0 + len2;
                                    this._r = 1;
                                    break;
                                }
                            }
                            continue;
                        }

                        case CODE_CMD_OFFS + 37: {// move
                            ++line;
                            const find0    = org.find0;
                            const find1    = org.find1;
                            const len      = find1 - find0 + 1;
                            const moveCode = code.slice(find0, find1 + 1);
                            code.splice(find0, len);
                            code.splice(find1 - len, 0, ...moveCode);
                            continue;
                        }

                        case CODE_CMD_OFFS + 38: {// see
                            ++line;
                            ax = data[org.offset + ax] || 0;
                            continue;
                        }

                        case CODE_CMD_OFFS + 39: {// say
                            ++line;
                            const freq = abs(bx) % Config.worldFrequency;
                            this._freq[freq] = ax;
                            org.freq = freq;
                            continue;
                        }

                        case CODE_CMD_OFFS + 40: {// listen
                            ++line;
                            ax = this._freq[abs(bx) % Config.worldFrequency];
                            continue;
                        }

                        case CODE_CMD_OFFS + 41: {// nread
                            ++line;
                            const offset = org.offset + DIR[abs(ax) % 8];
                            const dot    = data[offset];
                            if (!dot) {this._r = 0; continue}
                            const nearOrg = orgsRef[dot & ORG_INDEX_MASK];
                            ax = nearOrg.code[bx] || 0;
                            this._r = 1;
                            continue;
                        }

                        case CODE_CMD_OFFS + 42: {// nsplit
                            ++line;
                            const dot     = data[org.offset + DIR[abs(ax) % 8]];
                            if (!dot) {this._r = 0; continue}
                            const nearOrg = orgsRef[dot & ORG_INDEX_MASK];
                            const newCode = nearOrg.code.splice(0, bx);
                            const clone   = this._createOrg(org.offset + DIR[abs(ax) % 8], nearOrg, newCode);
                            this._db && this._db.put(clone, nearOrg);
                            this._r = 1;
                            continue;
                        }

                        case CODE_CMD_OFFS + 43: {// get
                            ++line;
                            if (org.packet !== 0) {this._r = 0; continue}
                            const dot = data[org.offset + DIR[abs(ax) % 8]];
                            if (!dot) {this._r = 0; continue}
                            this._removeOrg(org.packet = orgsRef[dot & ORG_INDEX_MASK]);
                            continue;
                        }

                        case CODE_CMD_OFFS + 44: {// put
                            ++line;
                            if (org.packet === 0) {this._r = 0; continue}
                            const offset = org.offset + DIR[abs(ax) % 8];
                            const dot  = data[offset];
                            if (dot || offset < 0 || offset > MAX_OFFS) {this._r = 0; continue}
                            this._createOrg(offset, undefined, org.packet);
                            this._db && this._db.put(org.packet);
                            org.packet = null;
                            continue;
                        }










                            if (cmd === CODE_CMD_OFFS + 2) { // clone
                                ++line;
                                if (orgs.full) {
                                    continue
                                }
                                const offset = org.offset + DIR[abs(d) % 8];
                                if (data[offset] !== 0) {
                                    continue
                                }
                                const clone = this._createOrg(offset, orgsRef[orgs.freeIndex], org);
                                if (rand(Config.codeMutateEveryClone) === 0) {
                                    Mutations.mutate(clone)
                                }
                                if (rand(Config.codeCrossoverEveryClone) === 0) {
                                    const org2 = orgsRef[rand(orgs.size)];
                                    org2 !== null && Mutations.crossover(clone, org2)
                                }
                                this._db && this._db.put(clone, org);
                                continue;
                            }

                            if (cmd === CODE_CMD_OFFS + 21) {// offs
                                d = org.offset;
                                ++line;
                                continue;
                            }

                            if (cmd === CODE_CMD_OFFS + 29) {// mix
                                const packet = org.packet;
                                if (packet === 0) {
                                    b = 0;
                                    ++line;
                                    continue
                                }
                                const offset = org.offset + DIR[abs(d) % 8];
                                let dot;
                                //
                                // << 28 - dot is an energy
                                //
                                if (offset < 0 || offset > MAX_OFFS || (dot = data[offset]) === 0 || (dot & ORG_MASK) !== 0 || (dot << 28) !== 0 || (packet << 28) !== 0) {
                                    b = 0;
                                    ++line;
                                    continue
                                }
                                const atom1 = ((dot & ORG_ATOM_MASK) >>> 4) || 1;
                                const atom2 = ((packet & ORG_ATOM_MASK) >>> 4) || 1;
                                org.packet = 0;
                                //
                                // This remove() must be before dot()
                                //
                                //this._ENERGY.remove(offset);
                                this._world.dot(offset, b = (dot & ENERGY_OFF_MASK | (atom1 + atom2) << 4));
                                ++line;
                                continue;
                            }
                            //
                            // We are on the last code line. Have to jump to the first
                            //
                            if (line >= code.length) {
                                if (org.stackIndex >= 0) {
                                    const stack = org.stack;
                                    b = stack[3];
                                    a = stack[2];
                                    d = stack[1];
                                    line = stack[0];
                                    org.stackIndex = -1;
                                } else {
                                    line = 0;
                                }
                            }

                        if (cmd < CODE_CMD_OFFS && cmd > -CODE_CMD_OFFS) {ax = cmd; ++line; continue}
                    }
                }
                org.line = line;
                org.d    = d;
                org.a    = a;
                org.b    = b;
                //
                // Organism age related updates
                //
                const age = org.age;
                if (age % org.period === 0 && age > 0 && mutationPeriod > 0) {Mutations.mutate(org)}
                if (age % maxAge === 0 && age > 0) {this._removeOrg(org)}
                if (age % energyPeriod === 0 && energyPeriod > 0) {
                    //
                    // Energy waste depends on energy amount. Big (more energy) organism spends more energy
                    //
                    org.energy--;
                    if (org.energy <= 0) {this._removeOrg(org)}
                }
                // TODO:
                //if ((this.totalOrgsEnergy + this._ENERGY.curAmount * energyValue) < MAX_ENERGY) {this._ENERGY.add()}

                org.age++;
                this._i += lines;
                orgsEnergy += org.energy;
            }
            //
            // Global cataclysm logic. If global similarity is more then 30%, then this
            // mechanism start working. 30% of all organisms will be removed and new random
            // generated organisms will be created
            //
            if (this._iterations % cataclysmPeriod === 0) {this._updateCataclysm(orgs)}

            this.totalOrgsEnergy = orgsEnergy;
            this._iterations++;
        }
        //
        // Updates status line at the top of screen
        //
        const ts = Date.now();
        if (ts - this._ts > 1000) {
            const orgAmount = orgs.items;
            world.title(`inps:${round(((this._i / orgAmount) / (((ts - this._ts) || 1)) * 1000))} orgs:${orgAmount} onrg:${(this.totalOrgsEnergy / orgAmount) << 0} diff:${this._diff} gen:${this._population}`);
            this._ts = ts;
            this._i  = 0;

            if (orgs.items === 0) {this._createOrgs()}
        }
    }

    _updateCataclysm(orgs) {
        const org1 = orgs.get(rand(orgs.size));
        const org2 = orgs.get(rand(orgs.size));
        const data = this._world.data;
        if (org1 !== null && org2 !== null) {
            this._averageDistance += Helper.distance(org1.code, org2.code);
            this._averageCodeSize += ceil((org1.code.length + org2.code.length) / 2);
            if (this._iterations > 100) {
                this._diff = round(((this._averageDistance / this._averageAmount) / (this._averageCodeSize / this._averageAmount)) * 100) / 100;
            }
            if (++this._averageAmount > (Config.orgAmount * .3)) {
                this._diff = round(((this._averageDistance / this._averageAmount) / (this._averageCodeSize / this._averageAmount)) * 100) / 100;
                if (this._diff < Config.worldOrgsSimilarityPercent) {
                    for (let i = 0, orgAmount = ceil(orgs.items * Config.worldOrgsSimilarityPercent); i < orgAmount; i++) {
                        const org2Kill = orgs.get(i);
                        if (org2Kill === null) {orgAmount++; continue}
                        const offset = rand(MAX_OFFS);
                        if (data[offset] === 0) {
                            this._removeOrg(org2Kill);
                            const org = this._createOrg(offset, org2Kill);
                            this._db && this._db.put(org);
                        }
                    }
                }
                this._averageAmount   = 0;
                this._averageDistance = 0;
                this._averageCodeSize = 0;
            }
        }
    }

    // TODO: organism from packet should be placed near dead one
    _removeOrg(org) {
        const offset = org.offset;
        const packet = org.packet;

        org.energy = 0;
        this._orgs.del(org.item, false);
        this._world.empty(offset);
        this._world.dot(offset, org.dot);
    }

    /**
     * Creates organisms population according to Config.orgAmount amount.
     * Organisms will be placed randomly in a world
     */
    _createOrgs() {
        const world     = this._world;
        const data      = world.data;
        let   orgAmount = Config.orgAmount;

        this._orgs = new FastArray(orgAmount);
        //
        // Only quarter of the population will be created on the beginning
        //
        orgAmount >>>= 2;
        while (orgAmount > 0) {
            const offset = rand(MAX_OFFS);
            if (data[offset] === 0) {
                const org = this._createOrg(offset);
                this._db && this._db.put(org);
                orgAmount--;
            }
        }
        this._population++;
    }

    /**
     * Creates one organism with default parameters and empty code
     * @param {Number} offset Absolute org offset
     * @param {Organism=} deadOrg Dead organism we may replace by new one
     * @param {Organism=} parent Create from parent
     * @param {Array=} code New org code
     * @returns {Object} Item in FastArray class
     */
    _createOrg(offset, deadOrg = undefined, parent = null, code = null) {
        const orgs = this._orgs;
        const org  = deadOrg && deadOrg.init(Helper.id(), offset, deadOrg.item, parent, code) ||
                     new Organism(Helper.id(), offset, orgs.freeIndex, parent, code);

        orgs.add(org);
        this._world.org(offset, org);

        return org;
    }

    _createSurfaces() {
        const AMOUNT = SURFS.length;

        const surfaces = new Array(AMOUNT);
        for (let i = 0; i < AMOUNT; i++) {
            surfaces[i] = new Elements(SURFS[i], i, this._world);
        }

        return surfaces;
    }
}

module.exports = VM;