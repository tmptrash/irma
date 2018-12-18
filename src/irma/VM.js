/**
 * Supported commands:
 *   N             - number - sets this number to d. number in range -CMD_OFFS...CMD_OFFS
 *   CMD_OFFS + 0  - step   - moves organism using current d direction
 *   CMD_OFFS + 1  - eat    - eats something using current d direction
 *   CMD_OFFS + 2  - clone  - clones himself using current d direction
 *   CMD_OFFS + 3  - see    - see using current d direction
 *   CMD_OFFS + 4  - dtoa   - copy value from d to a
 *   CMD_OFFS + 5  - dtob   - copy value from d to b
 *   CMD_OFFS + 6  - atod   - copy value from a to d
 *   CMD_OFFS + 7  - btod   - copy value from b to d
 *   CMD_OFFS + 8  - add    - d = a + b
 *   CMD_OFFS + 9  - sub    - d = a - b
 *   CMD_OFFS + 10 - mul    - d = a * b
 *   CMD_OFFS + 11 - div    - d = a / b
 *   CMD_OFFS + 12 - inc    - d++
 *   CMD_OFFS + 13 - dec    - d--
 *   CMD_OFFS + 14 - jump   - jump to d line
 *   CMD_OFFS + 15 - jumpg  - jump to d line if a > b
 *   CMD_OFFS + 16 - jumpl  - jump to d line if a <= b
 *   CMD_OFFS + 17 - jumpz  - jump to d line if a === 0
 *   CMD_OFFS + 18 - nop    - no operation
 *   CMD_OFFS + 19 - get    - d = mem[a]
 *   CMD_OFFS + 20 - put    - mem[a] = d
 *   CMD_OFFS + 21 - x      - d = org.x
 *   CMD_OFFS + 22 - y      - d = org.y
 *
 * @author flatline
 */
const Config   = require('./../Config');
const Helper   = require('./../common/Helper');
const Organism = require('./Organism');
/**
 * {Number} Amount of supported commands in a code
 */
const COMMANDS = 21;
/**
 * {Number} This offset will be added to commands value. This is how we
 * add an ability to use numbers in a code, just putting them as command
 */
const CMD_OFFS = 128;
/**
 * {Number} Maximum stack size, which may be used for recursion or function parameters
 */
const MAX_STACK_SIZE = 30000;
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

const WIDTH  = Config.worldWidth - 1;
const HEIGHT = Config.worldHeight - 1;
const MAX    = Number.MAX_VALUE;
const EATED  = Config.worldEnergy;

const ceil   = Math.ceil;
const round  = Math.round;
const rand   = Helper.rand;
const fin    = Number.isFinite;
const abs    = Math.abs;
const nan    = Number.isNaN;

class VM {
    constructor(world, orgs) {
        this.world      = world;
        this.orgs       = orgs;
        this.iterations = 0;
        this.probsCbs   = [
            this._onChange.bind(this),
            this._onDel.bind(this),
            this._onPeriod.bind(this),
            this._onAmount.bind(this),
            this._onProbs.bind(this),
            this._onInsert.bind(this),
            this._onCopy.bind(this),
            this._onCut.bind(this)
        ];

        this._createOrgs();
    }

    /**
     * Runs code of all organisms Config.iterationsPerRun time and return. Big
     * times value may slow down user and browser interaction
     */
    run() {
        const times = Config.iterationsPerRun;
        let   lines = Config.linesPerIteration;
        const orgs  = this.orgs;
        const world = this.world;
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
                    const intd = abs(ceil(d));
                    //
                    // This is a number command: d = N
                    //
                    if (code[line] > -CMD_OFFS && code[line] < CMD_OFFS) {
                        d = code[line];
                        continue;
                    }
                    //
                    // This is ordinary command
                    //
                    switch (code[line]) {
                        case CMD_OFFS: { // step
                            const x = org.x + DIRX[intd % 8];
                            const y = org.y + DIRY[intd % 8];
                            if (x < 0 || x > WIDTH || y < 0 || y > HEIGHT || data[x][y] !== 0) {continue}
                            world.move(org.x, org.y, org.x = x, org.y = y, org.color);
                            break;
                        }

                        case CMD_OFFS + 1: { // eat
                            const x   = org.x + DIRX[intd % 8];
                            const y   = org.y + DIRY[intd % 8];
                            if (x < 0 || x > WIDTH || y < 0 || y > HEIGHT) {continue}
                            const dot = data[x][y];
                            if (dot === 0) {continue}                                    // no energy or out of the world
                            if (!!dot && dot.constructor === Object) {                   // other organism
                                const energy = dot.energy <= intd ? dot.energy : intd;
                                dot.energy -= energy;
                                org.energy += energy;
                                continue;
                            }
                            org.energy += EATED;                                         // just energy block
                            world.empty(x, y, 0);
                            break
                        }

                        case CMD_OFFS + 2: { // clone
                            if (orgs.full) {continue}
                            const clone  = org.clone();
                            this._createOrg(clone.x, clone.y, org);
                            clone.energy = ceil(clone.energy / 2);
                            clone.item   = orgs.freeIndex;
                            break;
                        }

                        case CMD_OFFS + 3: { // see
                            const x   = org.x + DIRX[intd % 8];
                            const y   = org.y + DIRY[intd % 8];
                            if (x < 0 || x > WIDTH || y < 0 || y > HEIGHT) {d = EMPTY; continue}
                            const dot = data[x][y];
                            if (dot === 0) {d = EMPTY; continue}                         // no energy or out of the world
                            if (!!dot && dot.constructor === Object) {d = ORG; continue} // other organism
                            d = ENERGY;                                                  // just energy block
                            break;
                        }

                        case CMD_OFFS + 4:   // dtoa
                            a = d;
                            break;

                        case CMD_OFFS + 5:   // dtob
                            b = d;
                            break;

                        case CMD_OFFS + 6:   // atod
                            d = a;
                            break;

                        case CMD_OFFS + 7:   // abod
                            b = a;
                            break;

                        case CMD_OFFS + 8:   // add
                            d = a + b;
                            d = fin(d) ? d : MAX;
                            break;

                        case CMD_OFFS + 9:   // sub
                            d = a - b;
                            d = fin(d) ? d : -MAX;
                            break;

                        case CMD_OFFS + 10:  // mul
                            d = a * b;
                            d = fin(d) ? d : MAX;
                            break;

                        case CMD_OFFS + 11:  // div
                            d = a / b;
                            d = fin(d) ? d : 0;
                            d = !nan(d) ? d : 0;
                            break;

                        case CMD_OFFS + 12:  // inc
                            d++;
                            d = fin(d) ? d : MAX;
                            break;

                        case CMD_OFFS + 13:  // dec
                            d--;
                            d = fin(d) ? d : -MAX;
                            break;

                        case CMD_OFFS + 14:  // jump
                            if (intd >= code.length) {continue}
                            line = intd;
                            break;

                        case CMD_OFFS + 15:  // jumpg
                            if (intd >= code.length) {continue}
                            if (a > b) {line = intd}
                            break;

                        case CMD_OFFS + 16:  // jumpl
                            if (intd >= code.length) {continue}
                            if (a <= b) {line = intd}
                            break;

                        case CMD_OFFS + 17:  // jumpz
                            if (intd >= code.length) {continue}
                            if (a === 0) {line = intd}
                            break;

                        case CMD_OFFS + 18:  // nop
                            break;

                        case CMD_OFFS + 19:  // get
                            if (intd >= org.mem.length) {continue}
                            d = org.mem[intd];
                            break;

                        case CMD_OFFS + 20:  // put
                            if (intd >= org.mem.length) {continue}
                            org.mem[intd] = d;
                            break;

                        case CMD_OFFS + 21:  // x
                            d = org.x;
                            break;

                        case CMD_OFFS + 22:  // y
                            d = org.y;
                            break;
                    }
                }
                org.last = line;
                org.d    = d;
                org.a    = a;
                org.b    = b;
                this._update(org);
                org.age++;
                i += lines;
            }
            this.iterations++;
        }
        world.speed(`ips: ${round((i / (Date.now() - ts)) * 1000)}`);
    }

    destroy() {
        this.world = null;
        this.orgs  = null;
    }

    _removeOrg(org) {
        this.orgs.del(org.item);
        this.world.empty(org.x, org.y, 0);
    }

    /**
     * Creates organisms population according to Config.orgAmount amount.
     * Organisms will be placed randomly in a world
     */
    _createOrgs() {
        const world     = this.world;
        const orgAmount = Config.orgAmount;
        const rand      = Helper.rand;
        const width     = world.width;
        const height    = world.height;

        for (let i = 0; i < orgAmount; i++) {
            const x = rand(width);
            const y = rand(height);
            world.getDot(x, y) === 0 && this._createOrg(x, y);
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
        const orgs = this.orgs;
        const org  = parent || new Organism(Helper.id(), x, y, orgs.freeIndex, Config.orgEnergy, Config.orgColor);

        orgs.add(org);
        this.world.org(x, y, org);
    }

    _update(org) {
        if (org.age % Config.orgMutationPeriod === 0) {
            const code      = org.code;
            const mutations = round(code.length * Config.orgMutationPercent) || 1;
            const prob      = Helper.probIndex;
            for (let m = 0; m < mutations; m++) {this.probsCbs[prob(org.probs)](code, org)}
        }
        if (org.age % Config.orgEnergyPeriod === 0) {
            org.energy -= (org.code.length || 1);
        }
        if (this.iterations % Config.worldEnegyPeriod === 0) {
            this._addEnergy();
        }
    }

    _addEnergy() {
        const world  = this.world;
        const width  = world.width;
        const height = world.height;
        const amount = width * height * Config.worldEnergyPercent;
        const color  = Config.worldEnergyColor;
        const data   = world.data;
        const rand   = Helper.rand;

        for (let i = 0; i < amount; i++) {
            const x = rand(width);
            const y = rand(height);
            data[x][y] === 0 && world.dot(x, y, color);
        }
    }

    _onChange(code)      {code[rand(code.length)] = rand(COMMANDS) === 0 ? rand(CMD_OFFS) : rand(COMMANDS) + CMD_OFFS}
    _onDel   (code)      {code.splice(rand(code.length), 1)}
    _onPeriod(code, org) {org.period = rand(Config.ORG_MAX_PERIOD) + 1}
    _onAmount(code, org) {org.percent = Math.random()}
    _onProbs (code, org) {org.probs[rand(org.probs.length)] = rand(Config.PROB_MAX_VALUE)}
    _onInsert(code)      {code.splice(rand(code.length), 0, rand(COMMANDS) === 0 ? rand(CMD_OFFS) : rand(COMMANDS) + CMD_OFFS)}
    /**
     * Takes few lines from itself and inserts them before or after copied
     * part. All positions are random.
     * @return {Number} Amount of added/copied lines
     */
    _onCopy  (code) {
        const codeLen = code.length;
        const start   = rand(codeLen);
        const end     = start + rand(codeLen - start);
        //
        // Because we use spread (...) operator stack size is important
        // for amount of parameters and we shouldn't exceed it
        //
        if (end - start > MAX_STACK_SIZE) {return 0}
        //
        // Organism size should be less them codeMaxSize
        //
        if (codeLen + end - start >= Config.orgCodeMaxSize) {return 0}
        //
        // We may insert copied piece before "start" (0) or after "end" (1)
        //
        if (rand(2) === 0) {
            code.splice(rand(start), 0, ...code.slice(start, end));
            return end - start;
        }

        code.splice(end + rand(codeLen - end + 1), 0, ...code.slice(start, end));

        return end - start;
    }
    _onCut   (code)      {code.splice(rand(code.length), rand(code.length))}
}

module.exports = VM;