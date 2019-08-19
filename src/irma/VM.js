/**
 * This is Virtual Machine (VM) class. It runs "line" scripts, switches between them
 * works with registers and understands all available commands.
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
const RET_OK            = 1;
const RET_ERR           = 0;
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
const LINE_OFFS         = HEIGHT * WIDTH1;
const MAX_OFFS          = WIDTH1 * HEIGHT1 - 1;
const MAX               = Number.MAX_VALUE;
const MIN               = -MAX;

const ORG_CODE_MAX_SIZE = Config.orgMaxCodeSize;
/**
 * {Number} This color is a simple fix of black organism. In this case we
 * don't see him in a world
 */
const ORG_MIN_COLOR     = Config.ORG_MIN_COLOR;

const round             = Math.round;
const floor             = Math.floor;
const rand              = Helper.rand;
const fin               = Number.isFinite;
const abs               = Math.abs;

class VM {
    constructor() {
        this._world           = new World();
        this._orgs            = null;
        this._iterations      = 0;
        this._population      = 0;
        this._ts              = Date.now();
        this._i               = 0;
        this._freq            = {};
        for (let i = 0; i < Config.worldFrequency; i++) {this._freq[i] = 0}
        if (Config.DB_ON) {
            this._db          = new Db();
            this._db.ready.then(() => this._createOrgs());
        } else {this._createOrgs()}
    }

    destroy() {
        this._world.destroy();
        this._orgs.destroy();
        this._db && this._db.destroy();
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
        const times            = Config.codeTimesPerRun;
        const lines            = Config.codeLinesPerIteration;
        const world            = this._world;
        const mutationPeriod   = Config.orgMutationPeriod;
        const orgs             = this._orgs;
        const orgsRef          = orgs.getRef();
        const orgAmount        = orgs.size;
        //
        // Loop X times through population
        //
        for (let time = 0; time < times; time++) {
            //
            // Loop through population
            //
            let o = orgAmount;
            while (--o > -1) {
                const org  = orgsRef[o];
                if (org === null) {break}
                if (org.age <= 0) {continue}
                const code = org.code;
                let   ax   = org.ax;
                let   bx   = org.bx;
                let   line = org.line;
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

                        case CODE_CMD_OFFS + 3:  // pop
                            ++line;
                            ax = org.pop();
                            continue;

                        case CODE_CMD_OFFS + 4:  // push
                            ++line;
                            org.push(ax);
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
                            ax = round(ax / bx);
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
                            const loops = org.loops;
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

                        case CODE_CMD_OFFS + 23: {// call
                            if (org.fCount === 0) {++line; continue}
                            let index = org.stackIndex;
                            if (index >= CODE_STACK_SIZE * 3) {index = -1}
                            const func = abs(ax) % org.fCount;
                            const stack = org.stack;
                            stack[++index] = line + 1;
                            stack[++index] = ax;
                            stack[++index] = bx;
                            line = org.funcs[func];
                            org.stackIndex = index;
                            continue;
                        }

                        case CODE_CMD_OFFS + 24:   // func
                            line = org.offs[line];
                            if (line === 0 && org.stackIndex >= 0) {
                                const stack = org.stack;
                                bx   = stack[2];
                                ax   = stack[1];
                                line = stack[0];
                                org.stackIndex = -1;
                            }
                            continue;

                        case CODE_CMD_OFFS + 25: {// ret
                            const stack = org.stack;
                            let index = org.stackIndex;
                            if (index < 0) {line = 0; continue}
                            bx   = stack[index--];
                            ax   = stack[index--];
                            line = stack[index--];
                            org.stackIndex = index;
                            continue;
                        }

                        case CODE_CMD_OFFS + 26:  // end
                            switch (code[org.offs[line]]) {
                                case CODE_CMD_OFFS + 22: // loop
                                    line = org.offs[line];
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

                        case CODE_CMD_OFFS + 27:  // retax
                            ++line;
                            ax = org.ret;
                            continue;

                        case CODE_CMD_OFFS + 28:  // axret
                            ++line;
                            org.ret = ax;
                            continue;

                        case CODE_CMD_OFFS + 29:  // and
                            ++line;
                            ax &= bx;
                            continue;

                        case CODE_CMD_OFFS + 30:  // or
                            ++line;
                            ax |= bx;
                            continue;

                        case CODE_CMD_OFFS + 31:  // xor
                            ++line;
                            ax ^= bx;
                            continue;

                        case CODE_CMD_OFFS + 32:  // not
                            ++line;
                            ax = ~ax;
                            continue;

                        case CODE_CMD_OFFS + 33: {// join
                            ++line;
                            org.age -= Config.ageJoin;
                            const offset = org.offset + DIR[abs(ax) % 8];
                            const dot    = world.getOrgIdx(offset);
                            if (!dot) {org.ret = RET_ERR; continue}
                            const nearOrg = orgsRef[dot];
                            if (nearOrg.code.length + code.length > ORG_CODE_MAX_SIZE) {org.ret = RET_ERR; continue}
                            code.splice(bx >= code.length || bx < 0 ? code.length : bx, 0, ...nearOrg.code);
                            this._removeOrg(nearOrg);
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 34: {// split
                            ++line;
                            if (orgs.full) {org.ret = RET_ERR; continue}
                            const offset  = org.offset + DIR[abs(org.ret) % 8];
                            if (offset < 0 || offset > MAX_OFFS) {org.ret = RET_ERR; continue}
                            const dot     = world.getOrgIdx(offset);
                            if (dot) {org.ret = RET_ERR; continue} // organism on the way
                            if (ax < 0 || ax > code.length || bx <= ax) {org.ret = RET_ERR; continue}
                            const newCode = code.splice(ax, bx - ax);
                            if (newCode.length < 1) {org.ret = RET_ERR; continue}
                            const clone   = this._createOrg(offset, org, newCode);
                            org.preprocess();
                            this._db && this._db.put(clone, org);
                            if (code.length < 1) {this._removeOrg(org)}
                            clone.age = Config.orgMaxAge;
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 35: {// step
                            ++line;
                            org.age -= code.length;
                            let offset = org.offset + DIR[abs(ax) % 8];
                            if (offset < -1) {offset = LINE_OFFS + org.offset}
                            else if (offset > MAX_OFFS) {offset = org.offset - LINE_OFFS}
                            if (world.getOrgIdx(offset) !== 0) {org.ret = RET_ERR; continue}
                            world.moveOrg(org, offset);
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 36:  // find
                            ++line;
                            if (bx < 0) {
                                const ret   = org.ret;
                                const index = code.findIndex((c, i) => i >= ret && ax === c);
                                if (index === -1) {
                                    org.ret = RET_ERR;
                                } else {
                                    org.find0 = org.find1 = ax = index;
                                    org.ret = RET_OK;
                                }
                            } else {
                                if (bx > ax) {org.ret = RET_ERR; continue}
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

                        case CODE_CMD_OFFS + 37: {// move
                            ++line;
                            org.age -= Config.ageMove;
                            const find0    = org.find0;
                            const find1    = org.find1;
                            if (find1 < find0) {org.ret = RET_ERR; continue}
                            const len      = find1 - find0 + 1;
                            const moveCode = code.slice(find0, find1 + 1);
                            if (moveCode.length < 1) {org.ret = RET_ERR; continue}
                            const newAx    = ax < 0 ? 0 : (ax > code.length ? code.length : ax);
                            const offs     = newAx > find1 ? newAx - len : (newAx < find0 ? newAx : find0);
                            if (find0 === offs) {org.ret = RET_OK; continue}
                            code.splice(find0, len);
                            code.splice(offs, 0, ...moveCode);
                            if (rand(Config.codeMutateEveryClone) === 0) {
                                Mutations.mutate(org);
                            }
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 38:  // see
                            ++line;
                            const dot = world.getOrgIdx(org.offset + DIR[abs(ax) % 8]);
                            ax = (dot === 0 ? 0 : orgsRef[dot].color);
                            continue;

                        case CODE_CMD_OFFS + 39: {// say
                            ++line;
                            const freq = abs(bx) % Config.worldFrequency;
                            this._freq[freq] = ax;
                            org.freq = freq;
                            continue;
                        }

                        case CODE_CMD_OFFS + 40:  // listen
                            ++line;
                            ax = this._freq[abs(bx) % Config.worldFrequency];
                            continue;

                        case CODE_CMD_OFFS + 41: {// nread
                            ++line;
                            const offset = org.offset + DIR[abs(ax) % 8];
                            const dot    = world.getOrgIdx(offset);
                            if (!dot) {org.ret = RET_ERR; continue}
                            const nearOrg = orgsRef[dot];
                            ax = nearOrg.code[bx] || 0;
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 42: {// nsplit
                            ++line;
                            if (orgs.full) {org.ret = RET_ERR; continue}
                            const offset  = org.offset + DIR[abs(ax) % 8];
                            const dOffset = org.offset + DIR[abs(org.ret) % 8];
                            if (offset === dOffset) {org.ret = RET_ERR; continue}
                            const dot     = world.getOrgIdx(offset);
                            if (!dot) {org.ret = RET_ERR; continue}
                            const dDot    = world.getOrgIdx(dOffset);
                            if (dDot) {org.ret = RET_ERR; continue}
                            const nearOrg = orgsRef[dot];
                            const newCode = nearOrg.code.splice(0, bx);
                            if (newCode.length < 1) {org.ret = RET_ERR; continue}
                            const cutOrg  = this._createOrg(dOffset, nearOrg, newCode);
                            this._db && this._db.put(cutOrg, nearOrg);
                            if (code.length < 1) {this._removeOrg(org)}
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 43: {// get
                            ++line;
                            if (org.packet) {org.ret = RET_ERR; continue}
                            const dot = world.getOrgIdx(org.offset + DIR[abs(ax) % 8]);
                            if (!dot) {org.ret = RET_ERR; continue}
                            this._removeOrg(org.packet = orgsRef[dot]);
                            continue;
                        }

                        case CODE_CMD_OFFS + 44: {// put
                            ++line;
                            if (!org.packet) {org.ret = RET_ERR; continue}
                            if (orgs.full) {org.ret = RET_ERR; continue}
                            const offset = org.offset + DIR[abs(ax) % 8];
                            const dot    = world.getOrgIdx(offset);
                            if (dot || offset < 0 || offset > MAX_OFFS) {org.ret = RET_ERR; continue}
                            this._createOrg(offset, org.packet);
                            this._db && this._db.put(org.packet);
                            org.packet = null;
                            continue;
                        }

                        case CODE_CMD_OFFS + 45:  // offs
                            ++line;
                            ax = org.offset;
                            continue;

                        case CODE_CMD_OFFS + 46:  // age
                            ++line;
                            ax = org.age;
                            continue;

                        case CODE_CMD_OFFS + 47:  // line
                            ax = line++;
                            continue;

                        case CODE_CMD_OFFS + 48:  // len
                            line++;
                            ax = code.length;
                            continue;

                        case CODE_CMD_OFFS + 49:  // color
                            line++;
                            const newAx = abs(ax);
                            org.color   = (newAx < ORG_MIN_COLOR ? ORG_MIN_COLOR : newAx) % 0xffffff;
                            continue;
                    }
                    //
                    // This is constant value
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
                    }
                }
                org.line = line;
                org.ax   = ax;
                org.bx   = bx;
                //
                // Organism age related updates
                //
                const age = org.age;
                if (age % org.period === 0 && mutationPeriod > 0) {Mutations.mutate(org)}
                if (age < 0) {this._killOrg(org); org.age = Config.orgMaxAge}

                org.age--;
                this._i += lines;
            }
            this._iterations++;
        }
        //
        // Updates status line at the top of screen
        //
        const ts = Date.now();
        if (ts - this._ts > 1000) {
            const orgAmount = orgs.items;
            world.title(`inps:${round(((this._i / orgAmount) / (((ts - this._ts) || 1)) * 1000))} orgs:${orgAmount} gen:${this._population}`);
            this._ts = ts;
            this._i  = 0;

            if (orgs.items === 0) {this._createOrgs()}
        }
    }

    /**
     * Removes organism from the world totally. Places "packet" organism
     * instead original if exists on the same position. See _killOrg().
     * @param {Organism} org Organism to remove
     * @private
     */
    _removeOrg(org) {
        const offset = org.offset;
        const packet = org.packet;

        org.age = 0;
        this._orgs.del(org.item, false);
        this._world.empty(offset);
        packet && this._createOrg(offset, packet);
    }

    /**
     * Kills organism. Change it's atoms to random sequence. In this case
     * organism will stay non living thing. Just a bundle of atoms without
     * an ability to reproduce. Simply, it will be changed to one big molecule.
     * It will be present in a world. See _removeOrg().
     * @param {Organism} org Organism to kill.
     * @private
     */
    _killOrg(org) {
        const code = org.code;
        const len  = code.length;
        for (let i = 0, iLen = Config.codeKillTimes; i < iLen; i++) {
            code.push(...code.splice(rand(len), rand(len)));
        }
    }

    /**
     * Creates organisms population according to Config.orgAmount amount.
     * Organisms will be placed randomly in a world
     */
    _createOrgs() {
        const world     = this._world;
        let   orgAmount = floor(Config.orgAmount / Config.orgMoleculeCodeSize);

        this._orgs = new FastArray(Config.orgAmount);
        //
        // Creates atoms and molecules and LUCA as last organism
        //
        while (orgAmount-- > 0) {
            const offset = rand(MAX_OFFS);
            if (world.getOrgIdx(offset) !== 0) {orgAmount++; continue}
            const org = this._createOrg(offset);
            this._db && this._db.put(org);
        }
        //
        // Adds LUCA to the world
        //
        while (true) {
            const offset = rand(MAX_OFFS);
            if (world.getOrgIdx(offset) === 0) {
                const luca = this._createOrg(offset, null, Config.codeLuca.slice());
                this._db && this._db.put(luca);
                break;
            }
        }
        this._population++;
    }

    /**
     * Creates one organism with default parameters and empty code
     * @param {Number} offset Absolute org offset
     * @param {Organism=} parent Create from parent
     * @param {Array=} code New org code
     * @returns {Object} Item in FastArray class
     */
    _createOrg(offset, parent = null, code = null) {
        const orgs    = this._orgs;
        const deadOrg = orgs.get(orgs.freeIndex);
        const org     = deadOrg && deadOrg.init(Helper.id(), offset, deadOrg.item, parent, code) ||
                        new Organism(Helper.id(), offset, orgs.freeIndex, parent, code);

        orgs.add(org);
        this._world.org(offset, org);

        return org;
    }
}

module.exports = VM;