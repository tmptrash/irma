/**
 * Supported commands:
 *   N             - number - sets this number to d. number in range -CODE_CMD_OFFS...CODE_CMD_OFFS
 *   CODE_CMD_OFFS + 0  - step   - moves organism using current d direction
 *   CODE_CMD_OFFS + 1  - eat    - eats something using current d direction
 *   CODE_CMD_OFFS + 2  - clone  - clones himself using current d direction
 *   CODE_CMD_OFFS + 3  - see    - see using current d direction
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
 *   CODE_CMD_OFFS + 19 - get    - a = mem[d]
 *   CODE_CMD_OFFS + 20 - put    - mem[d] = a
 *   CODE_CMD_OFFS + 21 - x      - d = org.x
 *   CODE_CMD_OFFS + 22 - y      - d = org.y
 *
 * @author flatline
 */
const Config    = require('./../Config');
const FastArray = require('./../common/FastArray');
const Helper    = require('./../common/Helper');
const Organism  = require('./Organism');
const Mutations = require('./Mutations');
const Energy    = require('./Energy');
/**
 * {Number} This offset will be added to commands value. This is how we
 * add an ability to use numbers in a code, just putting them as command
 */
const CODE_CMD_OFFS = Config.CODE_CMD_OFFS;
/**
 * {Array} Array of increments. Using it we may obtain coordinates of the
 * point depending on one of 8 directions. We use these values in any command
 * related to sight, moving and so on
 */
const DIRX   = [0,  1,  1, 1, 0, -1, -1, -1];
const DIRY   = [-1, -1, 0, 1, 1,  1,  0, -1];
/**
 * {Number} Dot types in a world
 */
const EMPTY  = 0;
const ORG    = 1;
const ENERGY = 2;
/**
 * {Number} World size. Pay attantion, that width and height is -1
 */
const WIDTH  = Config.WORLD_WIDTH - 1;
const HEIGHT = Config.WORLD_HEIGHT - 1;
const MAX    = Number.MAX_VALUE;

const ceil   = Math.ceil;
const round  = Math.round;
const fin    = Number.isFinite;
const abs    = Math.abs;
const nan    = Number.isNaN;

class VM {
    constructor(world) {
        this._world      = world;
        this._orgs       = null;
        this._iterations = 0;
        this._ts         = Date.now();

        this._createOrgs();
    }

    /**
     * Runs code of all organisms Config.iterationsPerRun time and return. Big
     * times value may slow down user and browser interaction
     */
    run() {
        const times = Config.iterationsPerRun;
        const lines = Config.linesPerIteration;
        const orgs  = this._orgs;
        const world = this._world;
        const data  = world.data;
        let   ts    = Date.now();
        let   i     = 0;
        //
        // Loop X times through population
        //
        for (let time = 0; time < times; time++) {
            //
            // Loop through population
            //
            for (let o = 0, olen = orgs.size; o < olen; o++) {
                const org  = orgs.get(o);
                if (org === null) {continue}
                if (org.energy <= 0) {this._removeOrg(org); continue}

                const code = org.code;
                const len  = code.length;
                let   line = org.last;
                let   d    = org.d;
                let   a    = org.a;
                let   b    = org.b;
                //
                // Loop through few lines in one organism to
                // support pseudo multi threading
                //
                line = org.last;
                for (let l = 0; l < lines; l++) {
                    if (++line >= len) {line = 0}
                    //
                    // This is a number command: d = N
                    //
                    if (code[line] > -CODE_CMD_OFFS && code[line] < CODE_CMD_OFFS) {
                        d = code[line];
                        continue;
                    }
                    //
                    // This is ordinary command
                    //
                    switch (code[line]) {
                        case CODE_CMD_OFFS: { // step
                            const intd = abs(d << 0);
                            const x    = org.x + DIRX[intd % 8];
                            const y    = org.y + DIRY[intd % 8];
                            if (x < 0 || x > WIDTH || y < 0 || y > HEIGHT || data[x][y] !== 0) {continue}
                            world.move(org, x, y);
                            org.x = x;
                            org.y = y;
                            break;
                        }

                        case CODE_CMD_OFFS + 1: { // eat
                            const intd = abs(d << 0);
                            const x    = org.x + DIRX[intd % 8];
                            const y    = org.y + DIRY[intd % 8];
                            if (x < 0 || x > WIDTH || y < 0 || y > HEIGHT) {continue}
                            const dot  = data[x][y];
                            if (dot === 0) {continue}                                    // no energy or out of the world
                            if (!!dot && dot.constructor === Organism) {                 // other organism
                                const energy = dot.energy <= intd ? dot.energy : intd;
                                dot.energy -= energy;
                                org.energy += energy;
                                if (dot.energy <= 0) {this._removeOrg(dot)}
                                continue;
                            }
                            org.energy += Config.energyValue;                            // just energy block
                            world.empty(x, y, 0);
                            break
                        }

                        case CODE_CMD_OFFS + 2: { // clone
                            if (orgs.full || org.energy < Config.orgCloneEnergy) {continue}
                            const intd   = abs(d << 0);
                            const x      = org.x + DIRX[intd % 8];
                            const y      = org.y + DIRY[intd % 8];
                            if (x < 0 || x > WIDTH || y < 0 || y > HEIGHT || data[x][y] !== 0) {continue}
                            const clone  = this._createOrg(x, y, org);
                            org.energy   = clone.energy = ceil(org.energy / 2);
                            break;
                        }

                        case CODE_CMD_OFFS + 3: { // see
                            const intd = abs(d << 0);
                            const x    = org.x + DIRX[intd % 8];
                            const y    = org.y + DIRY[intd % 8];
                            if (x < 0 || x > WIDTH || y < 0 || y > HEIGHT) {d = EMPTY; continue}
                            const dot  = data[x][y];
                            if (dot === 0) {d = EMPTY; continue}                           // no energy or out of the world
                            if (!!dot && dot.constructor === Organism) {d = ORG; continue} // other organism
                            d = ENERGY;                                                    // just energy block
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

                        case CODE_CMD_OFFS + 7:   // abod
                            b = a;
                            break;

                        case CODE_CMD_OFFS + 8:   // add
                            d = a + b;
                            d = fin(d) ? d : MAX;
                            break;

                        case CODE_CMD_OFFS + 9:   // sub
                            d = a - b;
                            d = fin(d) ? d : -MAX;
                            break;

                        case CODE_CMD_OFFS + 10:  // mul
                            d = a * b;
                            d = fin(d) ? d : MAX;
                            break;

                        case CODE_CMD_OFFS + 11:  // div
                            d = a / b;
                            d = fin(d) ? d : 0;
                            d = !nan(d) ? d : 0;
                            break;

                        case CODE_CMD_OFFS + 12:  // inc
                            d++;
                            d = fin(d) ? d : MAX;
                            break;

                        case CODE_CMD_OFFS + 13:  // dec
                            d--;
                            d = fin(d) ? d : -MAX;
                            break;

                        case CODE_CMD_OFFS + 14: {// jump
                            const intd = abs(d << 0);
                            if (intd >= code.length) {continue}
                            line = intd;
                            break;
                        }

                        case CODE_CMD_OFFS + 15: {// jumpg
                            const intd = abs(d << 0);
                            if (intd >= code.length) {continue}
                            if (a > b) {
                                line = intd
                            }
                            break;
                        }

                        case CODE_CMD_OFFS + 16: {// jumpl
                            const intd = abs(d << 0);
                            if (intd >= code.length) {continue}
                            if (a <= b) {line = intd}
                            break;
                        }

                        case CODE_CMD_OFFS + 17:  // jumpz
                            const intd = abs(d << 0);
                            if (intd >= code.length) {continue}
                            if (a === 0) {line = intd}
                            break;

                        case CODE_CMD_OFFS + 18:  // nop
                            break;

                        case CODE_CMD_OFFS + 19: {// get
                            const intd = abs(d << 0);
                            if (intd >= org.mem.length) {continue}
                            a = org.mem[intd];
                            break;
                        }

                        case CODE_CMD_OFFS + 20: {// put
                            const intd = abs(d << 0);
                            if (intd >= org.mem.length) {continue}
                            org.mem[intd] = a;
                            break;
                        }

                        case CODE_CMD_OFFS + 21:  // x
                            d = org.x;
                            break;

                        case CODE_CMD_OFFS + 22:  // y
                            d = org.y;
                            break;
                    }
                }
                org.last = line;
                org.d    = d;
                org.a    = a;
                org.b    = b;
                Mutations.update(org);
                org.age++;
                i += lines;
            }
            if (this._iterations % Config.worldEnergyCheckPeriod === 0) {
                Energy.add(world);
            }

            this._iterations++;
        }
        if (ts - this._ts > 1000) {
            world.title(`inps: ${round(((i / orgs.length) / ((Date.now() - ts) || 1)) * 1000)} orgs: ${orgs.length}`);
            this._ts = ts;

            if (orgs.length === 0) {this._createOrgs()}
        }
    }

    destroy() {
        this._orgs.destroy();
        this._orgs  = null;
        this._world = null;
        this._orgs  = null;
    }

    _removeOrg(org) {
        this._orgs.del(org.item);
        this._world.empty(org.x, org.y);
    }

    /**
     * Creates organisms population according to Config.orgAmount amount.
     * Organisms will be placed randomly in a world
     */
    _createOrgs() {
        const world     = this._world;
        const data      = world.data;
        const orgAmount = Config.orgAmount;
        const rand      = Helper.rand;
        const width     = Config.WORLD_WIDTH;
        const height    = Config.WORLD_HEIGHT;

        this._orgs = new FastArray(Config.orgAmount);
        for (let i = 0; i < orgAmount; i++) {
            const x = rand(width);
            const y = rand(height);
            data[x][y] === 0 && this._createOrg(x, y);
        }
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
        const org  = new Organism(Helper.id(), x, y, orgs.freeIndex, Config.orgEnergy, Config.orgColor, parent);

        orgs.add(org);
        this._world.org(x, y, org);

        return org;
    }
}

module.exports = VM;