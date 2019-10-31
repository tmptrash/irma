/**
 * This is Virtual Machine (VM) class. It runs "line" scripts, switches between them
 * works with registers and understands all available commands.
 *
 * @author flatline
 */
const Config     = require('./../Config');
const FastArray  = require('../common/FastArray');
const Helper     = require('./../common/Helper');
const Db         = require('./../common/Db');
const Organism   = require('./Organism');
const Mutations  = require('./Mutations');
const World      = require('./World');
const PLUGINS    = Helper.requirePlugins(Config.PLUGINS);
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
 * {Number} Unique identifier, which should be set to ret register before split
 * command to keep child organism workable (interpretable with VM). Molecules
 * don't run with VM
 */
const IS_ORG_ID         = 17;
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
const rand              = Helper.rand;
const fin               = Number.isFinite;
const abs               = Math.abs;

class VM {
    constructor() {
        this.world            = new World({scroll: this._onScroll.bind(this)});
        this.orgsAndMols      = null;
        this.orgs             = null;
        this.population       = 0;
        this.api              = {createOrg: this._createOrg.bind(this)};

        this._ts              = Date.now();
        this._i               = 0;
        this._freq            = {};
        this._iteration       = 0;
        for (let i = 0; i < Config.worldFrequency; i++) {this._freq[i] = 0}
        //
        // Plugins should be created at the end after all needed properties exist
        //
        if (Config.DB_ON) {
            this._db          = new Db();
            this._db.ready.then(() => {
                this._createOrgs();
                this.plugins = Helper.loadPlugins(PLUGINS, [this]);
            });
        } else {
            this._createOrgs();
            this.plugins = Helper.loadPlugins(PLUGINS, [this]);
        }
    }

    destroy() {
        this.world.destroy();
        Helper.destroyPlugins(this.plugins);
        this.orgsAndMols.destroy();
        this._db && this._db.destroy();
        this.world        = null;
        this.plugins      = null;
        this.orgsAndMols  = null;
        this._db          = null;
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
        const stepEnergyCoef   = Config.energyStepCoef;
        const world            = this.world;
        const mutationPeriod   = Config.orgMutationPeriod;
        const orgsAndMols      = this.orgsAndMols;
        const orgsAndMolsRef   = orgsAndMols.ref();
        const orgs             = this.orgs;
        const orgsRef          = orgs.ref();
        //
        // Loop X times through population
        //
        for (let time = 0; time < times; time++) {
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
                            ax = ax < 0 ? rand(CODE_MAX_RAND * 2) - CODE_MAX_RAND : rand(ax);
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

                        case CODE_CMD_OFFS + 23: {// call
                            if (org.fCount === 0) {++line; continue}
                            let index = org.stackIndex;
                            if (index >= CODE_STACK_SIZE * 3) {index = -1}
                            const func     = abs(ax) % org.fCount;
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
                            if (org.ret !== 1) {org.ret = RET_ERR; continue}
                            const offset = org.offset + DIR[abs(ax) % 8];
                            const dot    = world.getOrgIdx(offset);
                            if (dot < 0) {org.ret = RET_ERR; continue}
                            const nearOrg = orgsAndMolsRef[dot];
                            if (nearOrg.code.length + code.length > ORG_CODE_MAX_SIZE) {org.ret = RET_ERR; continue}
                            code.splice(bx >= code.length || bx < 0 ? code.length : bx, 0, ...nearOrg.code);
                            org.energy += (nearOrg.code.length * Config.energyMultiplier);
                            this._removeOrg(nearOrg);
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 34: {// split
                            ++line;
                            if (orgsAndMols.full) {org.ret = RET_ERR; continue}
                            const offset  = org.offset + DIR[abs(org.ret) % 8];
                            if (offset < 0 || offset > MAX_OFFS) {org.ret = RET_ERR; continue}
                            const dot     = world.getOrgIdx(offset);
                            if (dot > -1) {org.ret = RET_ERR; continue} // organism on the way
                            if (ax < 0 || ax > code.length || bx <= ax) {org.ret = RET_ERR; continue}
                            const newCode = code.splice(ax, bx - ax);
                            if (newCode.length < 1 || org.ret === IS_ORG_ID && orgs.full) {org.ret = RET_ERR; continue}
                            const clone   = this._createOrg(offset, org, newCode, org.ret === IS_ORG_ID);
                            this._db && this._db.put(clone, org);
                            const energy = clone.code.length * Config.energyMultiplier;
                            clone.energy = energy;
                            if (Config.codeMutateEveryClone > 0 && rand(Config.codeMutateEveryClone) === 0 && clone.isOrg) {
                                Mutations.mutate(clone);
                            }
                            if (code.length < 1) {this._removeOrg(org); break}
                            org.energy  -= energy;
                            org.preprocess();
                            line = 0;
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 35: {// step
                            ++line;
                            org.energy -= Math.floor(code.length * stepEnergyCoef);
                            let offset = org.offset + DIR[abs(ax) % 8];
                            if (offset < -1) {offset = LINE_OFFS + org.offset}
                            else if (offset > MAX_OFFS) {offset = org.offset - LINE_OFFS}
                            if (world.getOrgIdx(offset) > -1) {org.ret = RET_ERR; continue}
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

                        case CODE_CMD_OFFS + 37: {// move
                            ++line;
                            org.energy -= Config.energyMove;
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
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 38:  // see
                            ++line;
                            const offset = org.offset + ax;
                            if (offset < 0 || offset > MAX_OFFS) {ax = 0; continue}
                            const dot = world.getOrgIdx(offset);
                            ax = (dot < 0 ? 0 : orgsAndMolsRef[dot].color || Config.molColor);
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
                            if (dot < 0) {org.ret = RET_ERR; continue}
                            const nearOrg = orgsAndMolsRef[dot];
                            ax = nearOrg.code[bx] || 0;
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 42: {// nsplit
                            ++line;
                            if (org.ret !== 1) {org.ret = RET_ERR; continue}
                            if (orgsAndMols.full) {org.ret = RET_ERR; continue}
                            const offset  = org.offset + DIR[abs(ax) % 8];
                            const dOffset = org.offset + DIR[abs(org.ret) % 8];
                            if (offset === dOffset) {org.ret = RET_ERR; continue}
                            const dot     = world.getOrgIdx(offset);
                            if (dot < 0) {org.ret = RET_ERR; continue}
                            const dDot    = world.getOrgIdx(dOffset);
                            if (dDot > -1) {org.ret = RET_ERR; continue}
                            const nearOrg = orgsAndMolsRef[dot];
                            const newCode = nearOrg.code.splice(0, bx);
                            if (newCode.length < 1) {org.ret = RET_ERR; continue}
                            const cutOrg  = this._createOrg(dOffset, nearOrg, newCode);
                            this._db && this._db.put(cutOrg, nearOrg);
                            if (nearOrg.code.length < 1) {this._removeOrg(nearOrg)}
                            const energy = newCode.length * Config.energyMultiplier;
                            nearOrg.energy -= energy;
                            cutOrg.energy   = energy;
                            if (code.length < 1) {this._removeOrg(org); break}
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 43: {// get
                            ++line;
                            if (org.ret !== 1 || org.packet) {org.ret = RET_ERR; continue}
                            const dot = world.getOrgIdx(org.offset + DIR[abs(ax) % 8]);
                            if (dot < 0) {org.ret = RET_ERR; continue}
                            this._removeOrg(org.packet = orgsAndMolsRef[dot]);
                            continue;
                        }

                        case CODE_CMD_OFFS + 44: {// put
                            ++line;
                            if (!org.packet) {org.ret = RET_ERR; continue}
                            if (orgsAndMols.full) {org.ret = RET_ERR; continue}
                            const offset = org.offset + DIR[abs(ax) % 8];
                            const dot    = world.getOrgIdx(offset);
                            if (dot > -1 || offset < 0 || offset > MAX_OFFS) {org.ret = RET_ERR; continue}
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
                if (age > Config.orgMaxAge) {this._mixAtoms(org)}
                if (org.energy < 0) {this._mixAtoms(org)}

                org.age++;
                org.energy--;
                this._i += lines;
            }
            //
            // Plugins
            //
            for (let p = 0, pl = this.plugins.length; p < pl; p++) {this.plugins[p].run(this._iteration)}
            this._iteration++;
        }
        //
        // Updates status line at the top of screen
        //
        const ts = Date.now();
        if (ts - this._ts > 1000) {
            const orgAmount = this.orgs.items;
            world.title(`inps:${round(((this._i / orgAmount) / (((ts - this._ts) || 1)) * 1000))} orgs:${orgAmount} gen:${this.population}`);
            this._ts = ts;
            this._i  = 0;

            if (orgs.items < 1) {this._createOrgs()}
        }
    }

    /**
     * Removes organism from the world totally. Places "packet" organism
     * instead original if exists on the same position. See _mixAtoms().
     * @param {Organism} org Organism to remove
     * @private
     */
    _removeOrg(org) {
        const offset = org.offset;
        const packet = org.packet;

        org.energy = 0;
        this._removeFromOrgMolArr(org.item);
        org.isOrg && this._removeFromOrgArr(org.orgItem);
        org.isOrg  = false;
        this.world.empty(offset);
        packet && this._createOrg(offset, packet);
    }

    /**
     * Mix organism commands. Change it's atoms to random sequence. In this case
     * organism will stay non living thing. Just a bundle of atoms without
     * an ability to reproduce. Simply, it will be changed to one big molecule.
     * It will be present in a world. See _removeOrg().
     * @param {Organism} org Organism to kill.
     * @private
     */
    _mixAtoms(org) {
        const code    = org.code;
        const coreLen = Config.codeLuca.length;
        const len     = code.length;
        if (len < 1) {return}
        for (let i = 0, iLen = Config.codeMixTimes; i < iLen; i++) {
            const pos1 = rand(coreLen);
            const pos2 = rand(len);
            code.push(...code.splice(pos1, pos1 + rand(coreLen - pos1)));
            code.push(...code.splice(pos2, pos2 + rand(len - pos2)));
        }
        org.isOrg && this._removeFromOrgArr(org.orgItem);
        org.isOrg = false;
    }

    _removeFromOrgArr(item) {
        const orgs = this.orgs;
        orgs.del(item);
        item < orgs.items && (orgs.get(item).orgItem = item);
    }

    _removeFromOrgMolArr(item) {
        const movedOrg = this.orgsAndMols.del(item);
        if (movedOrg) {
            movedOrg.item = item;
            this.world.setItem(movedOrg.offset, item);
        }
    }

    /**
     * Creates organisms population according to Config.molAmount amount.
     * Organisms will be placed randomly in a world
     */
    _createOrgs() {
        const cfg   = Config;
        const world = this.world;
        //
        // Molecules and organisms array should be created only once
        //
        if (!this.orgsAndMols) {
            this.orgsAndMols = new FastArray(cfg.molAmount + cfg.orgLucaAmount + 1);
            this.orgs        = new FastArray(round(cfg.molAmount * cfg.molCodeSize / (cfg.codeLuca.length || 1)) + cfg.orgLucaAmount + 1);
            //
            // Creates molecules and LUCA as last organism
            //
            let molecules = cfg.molAmount;
            while (molecules-- > 0) {
                const offset = rand(MAX_OFFS);
                if (world.getOrgIdx(offset) > -1) {molecules++; continue}
                const org = this._createOrg(offset);
                this._db && this._db.put(org);
            }
        }
        //
        // Adds LUCA organisms to the world
        //
        let orgs = Config.orgLucaAmount;
        while (orgs-- > 0) {
            const offset = rand(MAX_OFFS);
            if (world.getOrgIdx(offset) > -1) {orgs++; continue}
            const luca = this._createOrg(offset, null, Config.codeLuca.slice(), true);
            this._db && this._db.put(luca);
        }
        this.population++;
    }

    /**
     * Creates one organism with default parameters and empty code
     * @param {Number} offset Absolute org offset
     * @param {Organism=} parent Create from parent
     * @param {Array=} code New org code
     * @param {Boolean} isOrg Current molecule is an organism
     * @returns {Object} Item in FastArray class
     */
    _createOrg(offset, parent = null, code = null, isOrg = false) {
        const orgsAndMols = this.orgsAndMols;
        const orgs        = this.orgs;
        const deadOrg     = orgsAndMols.get(orgsAndMols.freeIndex);
        const org         = deadOrg && deadOrg.init(Helper.id(), offset, deadOrg.item, deadOrg.orgItem, parent, code, isOrg) ||
                            new Organism(Helper.id(), offset, orgsAndMols.freeIndex, orgs.freeIndex, parent, code, isOrg);

        orgsAndMols.add(org);
        isOrg && orgs.add(org);
        this.world.org(offset, org);

        return org;
    }

    /**
     * Is called on pressing one of arrow buttons. Scrolls world inside canvas
     * to appropriate direction till the it's edge and stops at the end or
     * beginning.
     * @param {MouseEvent} e
     */
    _onScroll(e) {
        const world  = this.world;
        const width  = Config.WORLD_CANVAS_WIDTH;
        const row    = Config.WORLD_WIDTH  - width;
        const col    = Config.WORLD_HEIGHT - Config.WORLD_CANVAS_HEIGHT;

        switch (e.which) {
            case 37: if ((world.viewX -= Config.worldScrollValue) < 0)    {world.viewX = 0;   this._scrollHorizontally(true)}  break; // left
            case 39: if ((world.viewX += Config.worldScrollValue) >= row) {world.viewX = row; this._scrollHorizontally(false)} break; // right
            case 38: if ((world.viewY -= Config.worldScrollValue) < 0)    {world.viewY = 0;   this._scrollVertically(true)}    break; // up
            case 40: if ((world.viewY += Config.worldScrollValue) >= col) {world.viewY = col; this._scrollVertically(false)}   break; // down
            default: return;
        }

        let   offs     = world.viewOffs = world.viewY * Config.WORLD_WIDTH + world.viewX;
        const canvas   = world.canvas;
        const orgs     = this.orgsAndMols.ref();
        const molColor = Config.molColor;
        //
        // Copy world's part into the canvas accodring to new scroll offsets
        //
        for (let y = 0, height = Config.WORLD_CANVAS_HEIGHT; y < height; y++) {
            const yOffs = y * width;
            for (let x = 0; x < width; x++) {
                const org = world.getOrgIdx(offs++);
                canvas.dot(yOffs + x, org === -1 ? 0x000000 : orgs[org].color || molColor);
            }
            offs += row;
        }
        world.viewX1    = world.viewX + width - 1;
        world.viewOffs1 = world.viewOffs + (Config.WORLD_CANVAS_HEIGHT - 1) * Config.WORLD_WIDTH + row + Config.WORLD_CANVAS_WIDTH - 1;

        return true;
    }

    _scrollHorizontally(right) {
        
    }

    _scrollVertically(down) {

    }
}
module.exports = VM;