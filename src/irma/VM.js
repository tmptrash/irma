/**
 * Supported commands:
 *   0  - step   - moves organism using current direction, result in d
 *   1  - eat    - eats something using current direction, result in d
 *   2  - clone  - clones himself using current direction, result in d
 *   3  - see    - see using current direction, result in d
 *   4  - dtoa   - copy value from d to a
 *   5  - dtob   - copy value from d to b
 *   6  - atod   - copy value from a to d
 *   7  - btod   - copy value from b to d
 *   8  - d0     - sets 0 to d
 *   9  - d1     - sets 1 to d
 *   10 - add    - d = a + b
 *   11 - sub    - d = a - b
 *   12 - mul    - d = a * b
 *   13 - div    - d = a / b
 *   14 - inc    - d++
 *   15 - dec    - d--
 *   16 - jump   - jump to d line
 *   17 - jumpg  - jump to d line if a > b
 *   18 - jumpl  - jump to d line if a <= b
 *   19 - jumpz  - jump to d line if a === 0
 *   20 - nop    - no operation
 *   21 - get    - d = mem[a]
 *   22 - put    - mem[a] = d
 *
 * @author flatline
 */
const Config   = require('./../Config');
const Helper   = require('./../common/Helper');
const Organism = require('./Organism');
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

const round  = Math.round;
const fin    = Number.isFinite;
const abs    = Math.abs;

class VM {
    constructor(world, orgs) {
        this.world = world;
        this.orgs  = orgs;

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
                //
                // This is experimental hack. To speed up the code we check
                // registers for Infinity only here - between code runs
                //
                d = fin(d) ? d : 0;
                a = fin(a) ? a : 0;
                b = fin(b) ? b : 0;
                for (let l = 0; l < lines; l++) {
                    if (++line >= len) {line = 0}
                    const intd = abs(round(d));
                    switch (code[line]) {
                        case 0: { // step
                            const x = org.x + DIRX[intd % 8];
                            const y = org.y + DIRY[intd % 8];
                            const dot = world.getDot(x, y);
                            if (!!dot && dot.constructor === Object || dot > 0 || world.outOf(x, y)) {d = 0; continue}

                            world.dot(org.x, org.y, 0);
                            world.dot(org.x = x, org.y = y, org.color);
                            d = 1;
                            break;
                        }

                        case 1: { // eat
                            const x = org.x + DIRX[intd % 8];
                            const y = org.y + DIRY[intd % 8];
                            const dot = world.getDot(x, y);
                            if (world.outOf(x, y) || dot === 0) {d = 0; continue} // no energy or out of the world
                            if (!!dot && dot.constructor === Object) {            // other organism
                                const energy = dot.energy <= intd ? dot.energy : intd;
                                dot.energy -= energy;
                                org.energy += energy;
                                d = 1;
                                continue;
                            }
                            const energy = dot <= intd ? dot : intd;              // just energy block
                            org.energy += energy;
                            world.dot(x, y, dot - energy);
                            d = 1;
                            break
                        }

                        case 2: { // clone
                            if (orgs.full) {d = 0; continue}
                            const clone = org.clone();
                            this._createOrg(clone.x, clone.y, clone);
                            clone.energy = Math.round(clone.energy / 2);
                            clone.item = orgs.freeIndex;
                            d = 1;
                            break;
                        }

                        case 3: { // see
                            const x = org.x + DIRX[intd % 8];
                            const y = org.y + DIRY[intd % 8];
                            const dot = world.getDot(x, y);
                            if (world.outOf(x, y) || dot === 0) {d = EMPTY; continue}    // no energy or out of the world
                            if (!!dot && dot.constructor === Object) {d = ORG; continue} // other organism
                            d = ENERGY;                                                  // just energy block
                            break;
                        }

                        case 4:   // dtoa
                            a = d;
                            break;

                        case 5:   // dtob
                            b = d;
                            break;

                        case 6:   // atod
                            d = a;
                            break;

                        case 7:   // abod
                            b = a;
                            break;

                        case 8:   // d0
                            d = 0;
                            break;

                        case 9:   // d1
                            d = 1;
                            break;

                        case 10:  // add
                            d = a + b;
                            break;

                        case 11:  // sub
                            d = a - b;
                            break;

                        case 12:  // mul
                            d = a * b;
                            break;

                        case 13:  // div
                            d = a / b;
                            break;

                        case 14:  // inc
                            d++;
                            break;

                        case 15:  // dec
                            d--;
                            break;

                        case 16:  // jump
                            if (intd >= code.length) {continue}
                            line = intd;
                            break;

                        case 17:  // jumpg
                            if (intd >= code.length) {continue}
                            if (a > b) {line = intd}
                            break;

                        case 18:  // jumpl
                            if (intd >= code.length) {continue}
                            if (a <= b) {line = intd}
                            break;

                        case 19:  // jumpz
                            if (intd >= code.length) {continue}
                            if (a === 0) {line = intd}
                            break;

                        case 20:  // nop
                            break;

                        case 21:  // get
                            if (intd >= org.mem.length) {continue}
                            d = org.mem[intd];
                            break;

                        case 22:  // put
                            if (intd >= org.mem.length) {continue}
                            org.mem[intd] = d;
                            break;
                    }
                }
                org.last = line;
                org.d    = d;
                org.a    = a;
                org.b    = b;
            }
        }
    }

    destroy() {
        this.world = null;
        this.orgs  = null;
    }

    _removeOrg(org) {
        this.orgs.del(org.item);
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
        this.world.dot(x, y, org);
    }
}

module.exports = VM;