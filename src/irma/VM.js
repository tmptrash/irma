/**
 * Supported commands:
 *   N                  - number - sets this number to d. number in range -CODE_CMD_OFFS...CODE_CMD_OFFS
 *   CODE_CMD_OFFS + 0  - step   - moves organism using current d direction
 *   CODE_CMD_OFFS + 1  - eat    - eats something using current d direction
 *   CODE_CMD_OFFS + 2  - clone  - clones himself using current d direction
 *   CODE_CMD_OFFS + 3  - see    - see using current d offset
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
 *   CODE_CMD_OFFS + 14 - jump   - jump to d line
 *   CODE_CMD_OFFS + 15 - jumpg  - jump to d line if a > b
 *   CODE_CMD_OFFS + 16 - jumpl  - jump to d line if a <= b
 *   CODE_CMD_OFFS + 17 - jumpz  - jump to d line if a === 0
 *   CODE_CMD_OFFS + 18 - nop    - no operation
 *   CODE_CMD_OFFS + 19 - mget   - a = mem[d]
 *   CODE_CMD_OFFS + 20 - mput   - mem[d] = a
 *   CODE_CMD_OFFS + 21 - x      - d = org.x
 *   CODE_CMD_OFFS + 22 - y      - d = org.y
 *   CODE_CMD_OFFS + 23 - rand   - d = rand(-CODE_CMD_OFFS..CODE_CMD_OFFS)
 *   CODE_CMD_OFFS + 24 - call   - calls function with name/index d % funcAmount
 *   CODE_CMD_OFFS + 25 - func   - function begin operator
 *   CODE_CMD_OFFS + 26 - ret    - returns from function. d will be return value
 *   CODE_CMD_OFFS + 27 - end    - function finish operator. no return value
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
const Surface   = require('./Surface');
const Energy    = require('./Energy');
/**
 * {Number} This offset will be added to commands value. This is how we
 * add an ability to use numbers in a code, just putting them as command
 */
const CODE_CMD_OFFS     = Config.CODE_CMD_OFFS;
/**
 * {Number} Maximum random generated value
 */
const CODE_MAX_RAND     = CODE_CMD_OFFS + Config.CODE_COMMANDS;
/**
 * {Array} Array of increments. Using it we may obtain coordinates of the
 * point depending on one of 8 directions. We use these values in any command
 * related to sight, moving and so on
 */
const DIRX              = Config.DIRX;
const DIRY              = Config.DIRY;
/**
 * {Number} World size. Pay attention, that width and height is -1
 */
const WIDTH             = Config.WORLD_WIDTH - 1;
const HEIGHT            = Config.WORLD_HEIGHT - 1;
const WIDTH1            = WIDTH + 1;
const MAX               = Number.MAX_VALUE;

const ENERGY_MASK       = Config.ENERGY_MASK;
const ENERGY_INDEX_MASK = 0x3fffffff;
const ORG_MASK          = 0x80000000;
const ORG_INDEX_MASK    = 0x7fffffff;
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
        this._world           = new World();
        this._surfaces        = this._createSurfaces();
        this._SURFS           = this._surfaces.length;
        this._ENERGY          = this._surfaces[0];
        this._orgs            = null;
        this._iterations      = 0;
        this._population      = 0;
        this._ts              = Date.now();
        this._totalOrgsEnergy = 0;
        this._i               = 0;
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
        for (let i = 0; i < this._surfaces.length; i++) {this._surfaces[i].destroy()}
        this._surfaces = null;
        this._world    = null;
        this._orgs     = null;
        this._world    = null;
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
        const times    = Config.codeTimesPerRun;
        const lines    = Config.codeLinesPerIteration;
        const orgs     = this._orgs;
        const world    = this._world;
        const data     = world.data;
        //
        // Loop X times through population
        //
        for (let time = 0; time < times; time++) {
            //
            // Loop through population
            //
            let orgsEnergy = 0;
            for (let o = 0, oLen = orgs.size; o < oLen; o++) {
                const org  = orgs.get(o);
                if (org === null) {continue}

                const code = org.code;
                const len  = code.length;
                let   d    = org.d;
                let   a    = org.a;
                let   b    = org.b;
                let   line = org.line;
                //
                // Loop through few lines in one organism to
                // support pseudo multi threading
                //
                for (let l = 0; l < lines; l++) {
                    const cmd = code[line];
                    //
                    // This is ordinary command
                    //
                    switch (cmd) {
                        case CODE_CMD_OFFS: { // step
                            const oldDot = org.dot;
                            if (oldDot !== 0) {
                                const surface = (oldDot & ENERGY_MASK) !== 0 ? this._ENERGY : this._surfaces[oldDot % SURFACES];
                                org.energy   -= surface.energy;
                                if ((org.radiation += surface.radiation) >= 1) {org.radiation = 0; Mutations.mutate(org)}
                                if (org.energy <= 0) {this._removeOrg(org); l = lines; break}
                                if (++org.steps < surface.step) {break}
                                org.steps = 0;
                            }
                            const intd   = abs(d << 0) % 8;
                            const x      = org.x + DIRX[intd];
                            const y      = org.y + DIRY[intd];
                            let   dot;
                            if (x < 0 || x > WIDTH || y < 0 || y > HEIGHT || ((dot = data[x][y]) & ORG_MASK) !== 0) {break}
                            //
                            // Organism can't step through stone
                            //
                            if ((dot & ENERGY_MASK) === 0 && this._surfaces[dot % SURFACES].barrier === true) {break}
                            org.dot = dot;
                            world.moveOrg(org, x, y);
                            (oldDot & ENERGY_MASK) !== 0 ? world.energy(org.x, org.y, oldDot) : world.dot(org.x, org.y, oldDot);
                            org.x = x;
                            org.y = y;
                            break;
                        }

                        case CODE_CMD_OFFS + 1: { // eat
                            const intd = abs(d << 0);
                            const x    = org.x + DIRX[intd % 8];
                            const y    = org.y + DIRY[intd % 8];
                            if (x < 0 || x > WIDTH || y < 0 || y > HEIGHT) {break}
                            const dot  = data[x][y];
                            if (dot === 0) {break}                                       // no energy or out of the world
                            if ((dot & ORG_MASK) !== 0) {                                // other organism
                                const nearOrg   = orgs.get(dot & ORG_INDEX_MASK);
                                const energy    = nearOrg.energy <= intd ? nearOrg.energy : intd;
                                nearOrg.energy -= energy;
                                org.energy     += energy;
                                if (nearOrg.energy <= 0) {this._removeOrg(nearOrg); l = lines}
                                break;
                            }
                            if ((dot & ENERGY_MASK) !== 0) {
                                org.energy += Config.energyValue;                        // just energy block
                                world.empty(x, y, 0);
                                this._ENERGY.clear(dot & ENERGY_INDEX_MASK);
                            }
                            break
                        }

                        case CODE_CMD_OFFS + 2: { // clone
                            if (orgs.full || org.energy < Config.orgCloneEnergy) {break}
                            const intd = abs(d << 0) % 8;
                            const x = org.x + DIRX[intd];
                            const y = org.y + DIRY[intd];
                            if (x < 0 || x > WIDTH || y < 0 || y > HEIGHT || data[x][y] !== 0) {break}
                            const clone = this._createOrg(x, y, org);
                            org.energy = clone.energy = ceil(org.energy >> 1);
                            if (org.energy <= 0) {this._removeOrg(org); this._removeOrg(clone); l = lines; break}
                            if (rand(Config.codeMutateEveryClone) === 0) {Mutations.mutate(clone)}
                            if (rand(Config.codeCrossoverEveryClone) === 0) {const org2 = orgs.get(rand(orgs.size)); org2 !== null && Mutations.crossover(clone, org2)}
                            this._db && this._db.put(clone, org);
                            break;
                        }

                        case CODE_CMD_OFFS + 3: { // see
                            const intd = abs(d << 0) % 8;
                            const x    = org.x + DIRX[intd] + (a << 0);
                            const y    = org.y + DIRY[intd] + (b << 0);
                            if (x < 0 || x > WIDTH || y < 0 || y > HEIGHT) {d = 0; break}
                            const dot  = data[x][y];
                            if ((dot & ORG_MASK) !== 0) {d = (orgs.get(dot & ORG_INDEX_MASK)).energy; break}    // other organism
                            d = dot;                                                    // some world object
                            break;
                        }

                        case CODE_CMD_OFFS + 4:   // dtoa
                            a = d;
                            break;

                        case CODE_CMD_OFFS + 5:   // dtob
                            b = d;
                            break;

                        case CODE_CMD_OFFS + 6:   // atod
                            d = a;
                            break;

                        case CODE_CMD_OFFS + 7:   // atob
                            b = a;
                            break;

                        case CODE_CMD_OFFS + 8:   // add
                            d = a + b;
                            if (!fin(d)) {d = MAX}
                            break;

                        case CODE_CMD_OFFS + 9:   // sub
                            d = a - b;
                            if (!fin(d)) {d = -MAX}
                            break;

                        case CODE_CMD_OFFS + 10:  // mul
                            d = a * b;
                            if (!fin(d)) {d = MAX}
                            break;

                        case CODE_CMD_OFFS + 11:  // div
                            d = a / b;
                            if (!fin(d) || nan(d)) {d = 0}
                            break;

                        case CODE_CMD_OFFS + 12:  // inc
                            if (!fin(++d)) {d = MAX}
                            break;

                        case CODE_CMD_OFFS + 13:  // dec
                            if (!fin(--d)) {d = -MAX}
                            break;

                        case CODE_CMD_OFFS + 14: {// jump
                            const newLine = (abs(d << 0) || 1) + line;
                            if (newLine > org.stack[org.stackIndex]) {if ((line = org.stack[org.stackIndex]) >= len) {line = 0; org.stackIndex = -1}}
                            else if (newLine < 0 || newLine >= code.length) {line = 0}
                            else {line = newLine}
                            continue;
                        }

                        case CODE_CMD_OFFS + 15: {// jumpg
                            if (a <= b) {break}
                            const newLine = (abs(d << 0) || 1) + line;
                            if (newLine > org.stack[org.stackIndex]) {if ((line = org.stack[org.stackIndex]) >= len) {line = 0; org.stackIndex = -1}}
                            else if (newLine < 0 || newLine >= code.length) {line = 0}
                            else {line = newLine}
                            continue;
                        }

                        case CODE_CMD_OFFS + 16: {// jumpl
                            if (a > b) {break}
                            const newLine = (abs(d << 0) || 1) + line;
                            if (newLine > org.stack[org.stackIndex]) {if ((line = org.stack[org.stackIndex]) >= len) {line = 0; org.stackIndex = -1}}
                            else if (newLine < 0 || newLine >= code.length) {line = 0}
                            else {line = newLine}
                            continue;
                        }

                        case CODE_CMD_OFFS + 17: {// jumpz
                            if (a !== 0) {break}
                            const newLine = (abs(d << 0) || 1) + line;
                            if (newLine > org.stack[org.stackIndex]) {if ((line = org.stack[org.stackIndex]) >= len) {line = 0; org.stackIndex = -1}}
                            else if (newLine < 0 || newLine >= code.length) {line = 0}
                            else {line = newLine}
                            continue;
                        }

                        case CODE_CMD_OFFS + 18:  // nop
                            break;

                        case CODE_CMD_OFFS + 19: {// mget
                            const intd = abs(d << 0);
                            if (intd >= org.mem.length) {break}
                            a = org.mem[intd];
                            break;
                        }

                        case CODE_CMD_OFFS + 20: {// mput
                            const intd = abs(d << 0);
                            if (intd >= org.mem.length) {break}
                            org.mem[intd] = a;
                            break;
                        }

                        case CODE_CMD_OFFS + 21:  // x
                            d = org.x;
                            break;

                        case CODE_CMD_OFFS + 22:  // y
                            d = org.y;
                            break;

                        case CODE_CMD_OFFS + 23:  // rand
                            d = rand(CODE_MAX_RAND * 2) - CODE_MAX_RAND;
                            break;

                        case CODE_CMD_OFFS + 24: {// call
                            if (org.fCount === 0) {break}
                            let   index = org.stackIndex;
                            if (index >= Config.CODE_STACK_SIZE * 5) {index = -1}
                            const func  = abs(d << 0) % org.fCount;
                            const stack = org.stack;
                            stack[++index] = line + 1;
                            stack[++index] = d;
                            stack[++index] = a;
                            stack[++index] = b;
                            const end = org.offs[org.funcs[func] - 1] - 1;
                            stack[++index] = end <= 0 ? len : end;
                            line = org.funcs[func];
                            org.stackIndex = index;
                            continue;
                        }

                        case CODE_CMD_OFFS + 25:  // func
                            line = org.offs[line];
                            if (line === 0 && org.stackIndex >= 0) {
                                const stack = org.stack;
                                b    = stack[3];
                                a    = stack[2];
                                d    = stack[1];
                                line = stack[0];
                                org.stackIndex = -1;
                            }
                            continue;

                        case CODE_CMD_OFFS + 26: {// ret
                            const stack = org.stack;
                            let   index = org.stackIndex;
                            if (index < 0) {break}
                            index--;              // we have to skip func end line
                            b    = stack[index--];
                            a    = stack[index--];
                            index--;              // we have to skip d register to return it
                            line = stack[index--];
                            org.stackIndex = index;
                            continue;
                        }

                        case CODE_CMD_OFFS + 27: {// end
                            const stack = org.stack;
                            let   index = org.stackIndex;
                            if (index < 0) {break}
                            index--;
                            b    = stack[index--];
                            a    = stack[index--];
                            d    = stack[index--];
                            line = stack[index--];
                            org.stackIndex = index;
                            continue;
                        }

                        default:
                            //
                            // This is a number command: d = N
                            //
                            if (cmd < CODE_CMD_OFFS && cmd > -CODE_CMD_OFFS) {d = cmd}
                            break;
                    }
                    //
                    // We are on the last code line. Have to jump to the first
                    //
                    if (++line >= len) {
                        if (org.stackIndex >= 0) {
                            const stack = org.stack;
                            b    = stack[3];
                            a    = stack[2];
                            d    = stack[1];
                            line = stack[0];
                            org.stackIndex = -1;
                        } else {
                            line = 0;
                        }
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
                if (age % org.period === 0 && age > 0 && Config.orgMutationPeriod > 0) {Mutations.mutate(org)}
                if (age % Config.orgMaxAge === 0 && age > 0) {this._removeOrg(org)}
                if (age % Config.orgEnergyPeriod === 0) {
                    //
                    // Energy waste depends on energy amount. Big (more energy) organism spends more energy
                    //
                    org.energy -= (1 + org.energy * Config.orgGrabEnergyPercent);
                    if (org.energy <= 0) {this._removeOrg(org)}
                }
                //
                // Global cataclysm logic. If global similarity is more then 30%, then this
                // mechanism start working. 30% of all organisms will be removed and new random
                // organisms will be created
                //
                if (this._iterations % Config.worldCataclysmCheck === 0) {
                    const org2 = orgs.get(rand(orgs.size));
                    if (org2 !== null) {
                        this._averageDistance += Helper.distance(org.code, org2.code);
                        this._averageCodeSize += org.code.length;
                        if (++this._averageAmount === Config.orgAmount) {
                            this._diff = round(((this._averageDistance / this._averageAmount) / (this._averageCodeSize / this._averageAmount)) * 100) / 100;
                            if (this._diff < Config.worldOrgsSimilarityPercent) {
                                for (let i = 0, orgAmount = ceil(orgs.items / Config.worldOrgsSimilarityPercent); i < orgAmount; i++) {
                                    const org2Kill = orgs.get(i);
                                    if (org2Kill === null) {orgAmount++; continue}
                                    const x = rand(Config.WORLD_WIDTH);
                                    const y = rand(Config.WORLD_HEIGHT);
                                    if (data[x][y] === 0) {
                                        this._removeOrg(org2Kill);
                                        const org = this._createOrg(x, y);
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
                //
                // This mechanism runs surfaces moving (energy, lava, holes, water, sand)
                //
                for (let s = 0, sLen = this._SURFS; s < sLen; s++) {
                    const surface = this._surfaces[s];
                    if (surface.curDelay++ >= surface.delay) {
                        surface.move();
                        surface.curDelay = 0;
                    }
                }

                org.age++;
                this._i += lines;
                orgsEnergy += org.energy;
            }

            this._ENERGY.update(this._totalOrgsEnergy);
            this._totalOrgsEnergy = orgsEnergy;
            this._iterations++;
        }
        //
        // Updates status line at the top of screen
        //
        const ts = Date.now();
        if (ts - this._ts > 1000) {
            const orgAmount = orgs.items;
            world.title(`inps:${round(((this._i / orgAmount) / (((ts - this._ts) || 1)) * 1000))} orgs:${orgAmount} onrg:${(this._totalOrgsEnergy / orgAmount) << 0} nrg:${(this._ENERGY.amount >> 1) - this._ENERGY._index + 1} gen:${this._population} diff:${this._diff}`);
            this._ts = ts;
            this._i  = 0;

            if (orgs.items === 0) {this._createOrgs()}
        }
    }

    _removeOrg(org) {
        this._orgs.del(org.item);
        this._world.empty(org.x, org.y);
        this._world.dot(org.x, org.y, org.dot);
    }

    /**
     * Creates organisms population according to Config.orgAmount amount.
     * Organisms will be placed randomly in a world
     */
    _createOrgs() {
        const world     = this._world;
        const data      = world.data;
        const width     = Config.WORLD_WIDTH;
        const height    = Config.WORLD_HEIGHT;
        let   orgAmount = Config.orgAmount;

        this._orgs = new FastArray(orgAmount);
        //
        // Only half of the population will be created on the beginning
        //
        orgAmount >>= 1;
        while (orgAmount > 0) {
            const x = rand(width);
            const y = rand(height);
            if (data[x][y] === 0) {
                const org = this._createOrg(x, y);
                this._db && this._db.put(org);
                orgAmount--;
            }
        }
        this._population++;
    }

    /**
     * Creates one organism with default parameters and empty code
     * @param {Number} x X coordinate
     * @param {Number} y Y coordinate
     * @param {Organism=} parent Create from parent
     * @returns {Object} Item in FastArray class
     */
    _createOrg(x, y, parent = null) {
        const orgs = this._orgs;
        const org  = new Organism(Helper.id(), x, y, orgs.freeIndex, Config.orgEnergy, parent);

        orgs.add(org);
        this._world.org(x, y, org);

        return org;
    }

    _createSurfaces() {
        const SURFS  = Config.worldSurfaces;
        const AMOUNT = SURFS.length + 1;

        const surfaces = new Array(AMOUNT);
        surfaces[0]    = new Energy(this._world);
        for (let i = 1; i < AMOUNT; i++) {
            surfaces[i] = new Surface(SURFS[i - 1], this._world);
        }

        return surfaces;
    }
}

module.exports = VM;