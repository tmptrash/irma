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
const RET_OK            = Config.CODE_RET_OK;
const RET_ERR           = Config.CODE_RET_ERR;
/**
 * {Number} World size. Pay attention, that width and height is -1
 */
const WIDTH             = Config.WORLD_WIDTH - 1;
const HEIGHT            = Config.WORLD_HEIGHT - 1;
const WIDTH1            = WIDTH + 1;
const HEIGHT1           = HEIGHT + 1;
const MAX_OFFS          = WIDTH1 * HEIGHT1 - 1;
const MAX               = Number.MAX_VALUE;
const MIN               = -MAX;

const rand              = Helper.rand;

class VM {
    /**
     * Should be overridden in child class to support other commands. For
     * example biloagical stuff
     * @param {Organism} org Current organism
     * @param {Number} cmd Command to run
     * @interface
     */
    runCmd() {}

    constructor() {
        this.world            = new World({scroll: this._onScroll.bind(this)});
        this.orgs             = null;
        this.population       = 0;
        this.api              = {createOrg: this.createOrg.bind(this)};

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
        this._db && this._db.destroy();
        this.world        = null;
        this.plugins      = null;
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
        const world            = this.world;
        const mutationPeriod   = Config.orgMutationPeriod;
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
                let   code = org.code;
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
                            if (!Number.isFinite(ax)) {ax = MAX}
                            continue;

                        case CODE_CMD_OFFS + 7:  // sub
                            ++line;
                            ax -= bx;
                            if (!Number.isFinite(ax)) {ax = MIN}
                            continue;

                        case CODE_CMD_OFFS + 8:  // mul
                            ++line;
                            ax *= bx;
                            if (!Number.isFinite(ax)) {ax = MAX}
                            continue;

                        case CODE_CMD_OFFS + 9:  // div
                            ++line;
                            ax = Math.round(ax / bx);
                            if (!Number.isFinite(ax)) {ax = MIN}
                            continue;

                        case CODE_CMD_OFFS + 10: // inc
                            ++line;
                            ax++;
                            if (!Number.isFinite(ax)) {ax = MAX}
                            continue;

                        case CODE_CMD_OFFS + 11:  // dec
                            ++line;
                            ax--;
                            if (!Number.isFinite(ax)) {ax = MIN}
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

                        case CODE_CMD_OFFS + 33:  // find
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

                        case CODE_CMD_OFFS + 34: {// move
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
                            // offsets, stack and context may be invalid. Generally, we have to preprocess
                            // it after move. But this process resets stack and current running script line
                            // to zero line and script start running from the beginning. To fix this we 
                            // just assume that moving command doesn't belong to main (replicator) script
                            // part and skip preprocessing. So, next line should not be uncommented
                            // org.preprocess();
                            // line = 0;
                            //
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 35:  // age
                            ++line;
                            ax = org.age;
                            continue;

                        case CODE_CMD_OFFS + 36:  // line
                            ax = line++;
                            continue;

                        case CODE_CMD_OFFS + 37:  // len
                            line++;
                            ax = code.length;
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
                    } else {
                        //
                        // Current command is not from standart list. Call child class if exist
                        //
                        this.runCmd(cmd);
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
                if (org.energy < 0 || age > Config.orgMaxAge) {
                    this.removeOrg(org);
                    this.createOrg(org.offset, null, null, org.code);
                }
                //
                // Age and energy should be changed every iteration
                //
                org.age++
                org.energy--;
                this._i += lines;
            }
            //
            // Plugins should be run after all organism iterations
            //
            for (let p = 0, pl = this.plugins.length; p < pl; p++) {this.plugins[p].run(this._iteration)}
            this._iteration++;
        }
        //
        // Updates status line at the top of screen
        //
        // TODO: shis code should be moved to Status plugin
        const ts = Date.now();
        if (ts - this._ts > 1000) {
            const orgAmount = this.orgs.items;
            world.title(`inps:${Math.round(((this._i / orgAmount) / (((ts - this._ts) || 1)) * 1000))} orgs:${orgAmount} gen:${this.population}`);
            this._ts = ts;
            this._i  = 0;

            if (orgs.items < 1) {this._createOrgs()}
        }
    }

    /**
     * Creates one organism with default parameters and empty code
     * @param {Number} offset Absolute org offset
     * @param {Organism=} parent Create from parent
     * @param {Array=} code New org code
     * @param {Boolean} isOrg Current molecule is an organism
     * @returns {Object} Item in FastArray class
     */
    createOrg(offset, freeIndex = null, parent = null, code = null, isOrg = false) {
        const orgs        = this.orgs;
        const org         = new Organism(Helper.id(), offset, orgs.freeIndex, freeIndex, parent, code, isOrg);

        isOrg && orgs.add(org);

        return org;
    }

    /**
     * Removes organism from the world totally. Places "packet" organism
     * instead original if exists on the same position.
     * @param {Organism} org Organism to remove
     */
    removeOrg(org) {
        const offset = org.offset;
        const packet = org.packet;

        org.energy = 0;
        org.isOrg && this._removeFromOrgArr(org.orgItem);
        org.isOrg  = false;
        this.world.empty(offset);
        packet && this.createOrg(offset, null, packet);
    }

    _removeFromOrgArr(item) {
        const orgs = this.orgs;
        orgs.del(item);
        item < orgs.items && (orgs.get(item).orgItem = item);
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
            this.orgs        = new FastArray(Math.round(cfg.molAmount * cfg.molCodeSize / (cfg.codeLuca.length || 1)) + cfg.orgLucaAmount + 1);
            //
            // Creates molecules and LUCA as last organism
            //
            let molecules = cfg.molAmount;
            while (molecules-- > 0) {
                const offset = rand(MAX_OFFS);
                if (world.getOrgIdx(offset) > -1) {molecules++; continue}
                const org = this.createOrg(offset);
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
            const luca = this.createOrg(offset, null, null, Config.codeLuca.slice(), true);
            this._db && this._db.put(luca);
        }
        this.population++;
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
            // TODO: not done
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

    // TODO: not done
    _scrollHorizontally(right) {
        
    }

    // TODO: not done
    _scrollVertically(down) {

    }
}
module.exports = VM;