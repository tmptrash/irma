/**
 * Supported commands:
 *   0  - step   - moves organism using current direction, result in d
 *   1  - eat    - eats something using current direction, result in d
 *   2  - clone  - clones himself using current direction, result in d
 *   3  - see    - see using current direction, result in d
 *   4  - seta   - copy value from d to a
 *   5  - setb   - copy value from d to b
 *   6  - set0   - sets 0 to d
 *   7  - set1   - sets 1 to d
 *   8  - add    - d = a + b
 *   9  - sub    - d = a - b
 *   10 - mul    - d = a * b
 *   11 - div    - d = a / b
 *   12 - inc    - d++
 *   13 - dec    - d--
 *   14 - jump   - jump to d line
 *   15 - jumpg  - jump to d line if a > b
 *   16 - jumpl  - jump to d line if a <= b
 *   17 - jumpz  - jump to d line if a === 0
 *   18 - nop    - no operation
 *   19 - push   - push(d)
 *   20 - pop    - d = pop()
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
        const round = Math.round;
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
                    const intd = round(d);
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
                            if (world.outOf(x, y) || dot === 0) {d = EMPTY; continue} // no energy or out of the world
                            if (!!dot && dot.constructor === Object) {                // other organism
                                d = ORG;
                                continue;
                            }
                            d = ENERGY;                                               // just energy block
                            break
                        }
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