/**
 * Extension of VM class. Adds biologically and physics related commands and into "line"
 * language like "join", "split", "see", "step" and so on. Creates organism population,
 * creates world with canvas and html elements.
 * 
 * @author flatline
 */
const Helper            = require('./../common/Helper');
const Config            = require('./../Config');
const VM                = require('./VM');
const Mutations         = require('./Mutations');
const World             = require('./World');
const FastArray         = require('./../common/FastArray');
const rand              = Helper.rand;

const RET_OK            = Config.CODE_RET_OK;
const RET_ERR           = Config.CODE_RET_ERR;
const ORG_CODE_MAX_SIZE = Config.orgMaxCodeSize;
const CODE_CMD_OFFS     = Config.CODE_CMD_OFFS;
const IS_ORG_ID         = Config.CODE_ORG_ID;
const DIR               = Config.DIR;
const WIDTH             = Config.WORLD_WIDTH - 1;
const HEIGHT            = Config.WORLD_HEIGHT - 1;
const WIDTH1            = WIDTH + 1;
const HEIGHT1           = HEIGHT + 1;
const LINE_OFFS         = HEIGHT * WIDTH1;
const MAX_OFFS          = WIDTH1 * HEIGHT1 - 1;     // We need -1 to prevent using offset >= MAX_OFFS ... instead offset > MAX_OFFS


const ORG_MIN_COLOR     = Config.ORG_MIN_COLOR;

class BioVM extends VM {
    constructor() {
        super(...arguments);

        this.orgsAndMols   = null;
        this.world         = new World({scroll: this._onScroll.bind(this)});
        this.freq          = new Int32Array(Config.worldFrequency);
        this.ts            = Date.now();
        this.i             = 0;

        this.createOrgs();
    }

    destroy() {
        super.destory();

        this.orgsAndMols.destroy();
        this.world.destroy();
        this.db && this.db.destroy();

        this.orgsAndMols = null;
        this.world       = null;
        this.db         = null;
    }

    get ready() {
        if (this.db) {
            return this.db.ready;
        }
        return new Promise(resolve => resolve());
    }

    /**
     * @override
     */
    beforeIteration(org) {
        //
        // Resets value of 'say' command
        //
        if (org.freq) {org.freq = this.freq[org.freq] = 0}
    }

    /**
     * @override
     */
    afterIteration(org) {
        if (org.energy < 0 || org.age > Config.orgMaxAge) {
            this.removeOrg(org);
            this.createOrg(org.offset, null, org.code);
        }
        org.energy--;
        this.i += Config.codeLinesPerIteration;
    }

    /**
     * Runs specified command, which is not a part of standart commands
     * like "add", "inc", "mul", "func", "ret", "end", "ifxx", ...
     * @param {Organism} org Current organism
     * @param {Number} cmd Command to run
     * @override
     */
    runCmd(org, cmd) {
        switch (cmd) {
            case CODE_CMD_OFFS + 42: {// join
                ++line;
                const offset = org.offset + DIR[abs(ax) % 8];
                const dot    = this.world.getOrgIdx(offset);
                if (dot < 0) {org.ret = RET_ERR; return}
                const nearOrg = this.orgsAndMolsRef[dot];
                if (nearOrg.code.length + org.code.length > ORG_CODE_MAX_SIZE) {org.ret = RET_ERR; return}
                org.code = org.code.push(nearOrg.code);
                //
                // Important: joining new commands into the script may break it, because it's
                // offsets, stack and context may be invalid. Generally, we have to compile
                // it after join. But this process resets stack and current running script line
                // to zero line and script start running from the beginning. To fix this we 
                // add any joined command to the end of script and skip compile. So, next
                // line should not be uncommented:
                // org.compile();
                //
                org.energy += (nearOrg.code.length * Config.energyMultiplier);
                this.removeOrg(nearOrg);
                org.ret = RET_OK;
                return;
            }

            case CODE_CMD_OFFS + 43: {// split
                ++line;
                if (this.orgsAndMols.full) {org.ret = RET_ERR; return}
                const offset  = org.offset + DIR[abs(org.ret) % 8];
                if (offset < 0 || offset > MAX_OFFS) {org.ret = RET_ERR; return}
                const dot     = this.world.getOrgIdx(offset);
                if (dot > -1) {org.ret = RET_ERR; return} // organism on the way
                const code = org.code;
                if (ax < 0 || ax > code.length || bx <= ax) {org.ret = RET_ERR; return}
                const newCode = code.subarray(ax, bx);
                org.code = code.splice(ax, bx - ax);
                if (newCode.length < 1 || org.cur() === IS_ORG_ID && this.orgs.full) {org.ret = RET_ERR; return}
                //
                // TODO: This is bad idea to hardcode IS_ORG_ID into organism. Because this mechanism
                // TODO: should be esupported by organism from parent to child
                //
                const clone   = this.createOrg(offset, org, newCode, org.cur() === IS_ORG_ID);
                this.db && this.db.put(clone, org);
                const energy = clone.code.length * Config.energyMultiplier;
                clone.energy = energy;
                if (Config.codeMutateEveryClone > 0 && rand(Config.codeMutateEveryClone) === 0 && clone.isOrg) {
                    Mutations.mutate(clone);
                }
                if (org.code.length < 1) {this.removeOrg(org); break}
                org.energy  -= energy;
                //
                // Important: after split, sequence of commands have been changed and it may break
                // entire script. Generally, we have to compile new script to fix all offsets
                // and run t again from the beginning. Preprocessing resets the context and stack.
                // So nothing will be running after split command. To fix this, we just assume that 
                // we split commands from tail, which don't affect main (replicator) part. Next line
                // should be commented
                // org.compile();
                // line = 0;
                //
                org.ret = RET_OK;
                return;
            }

            case CODE_CMD_OFFS + 44: {// step
                ++line;
                org.energy -= Math.floor(org.code.length * Config.energyStepCoef);
                let offset = org.offset + DIR[abs(ax) % 8];
                if (offset < -1) {offset = LINE_OFFS + org.offset}
                else if (offset > MAX_OFFS) {offset = org.offset - LINE_OFFS}
                if (this.world.getOrgIdx(offset) > -1) {org.ret = RET_ERR; return}
                this.world.moveOrg(org, offset);
                org.ret = RET_OK;
                return;
            }

            case CODE_CMD_OFFS + 45:  // see
                ++line;
                const offset = org.offset + ax;
                if (offset < 0 || offset > MAX_OFFS) {ax = 0; return}
                const dot = this.world.getOrgIdx(offset);
                ax = (dot < 0 ? 0 : this.orgsAndMolsRef[dot].color || Config.molColor);
                return;

            case CODE_CMD_OFFS + 46: {// say
                ++line;
                const freq = abs(bx) % Config.worldFrequency;
                this.freq[freq] = ax;
                org.freq = freq;
                return;
            }

            case CODE_CMD_OFFS + 47:  // listen
                ++line;
                ax = this.freq[abs(bx) % Config.worldFrequency];
                return;

            case CODE_CMD_OFFS + 48: {// nread
                ++line;
                const offset = org.offset + DIR[abs(ax) % 8];
                const dot    = this.world.getOrgIdx(offset);
                if (dot < 0) {org.ret = RET_ERR; return}
                const nearOrg = this.orgsAndMolsRef[dot];
                ax = nearOrg.code[bx] || 0;
                org.ret = RET_OK;
                return;
            }

            case CODE_CMD_OFFS + 49: {// nsplit
                ++line;
                if (org.ret !== 1) {org.ret = RET_ERR; return}
                if (this.orgsAndMols.full) {org.ret = RET_ERR; return}
                const offset  = org.offset + DIR[abs(ax) % 8];
                const dOffset = org.offset + DIR[abs(org.ret) % 8];
                if (offset === dOffset) {org.ret = RET_ERR; return}
                const dot     = this.world.getOrgIdx(offset);
                if (dot < 0) {org.ret = RET_ERR; return}
                const dDot    = this.world.getOrgIdx(dOffset);
                if (dDot > -1) {org.ret = RET_ERR; return}
                const nearOrg = this.orgsAndMolsRef[dot];
                const newCode = nearOrg.code.subarray(0, bx);
                nearOrg.code  = nearOrg.code.splice(0, bx);
                if (newCode.length < 1) {org.ret = RET_ERR; return}
                const cutOrg  = this.createOrg(dOffset, null, newCode);
                this.db && this.db.put(cutOrg, nearOrg);
                if (nearOrg.code.length < 1) {this.removeOrg(nearOrg)}
                const energy = newCode.length * Config.energyMultiplier;
                nearOrg.energy -= energy;
                cutOrg.energy   = energy;
                if (org.code.length < 1) {this.removeOrg(org); break}
                org.ret = RET_OK;
                return;
            }

            case CODE_CMD_OFFS + 50: {// get
                ++line;
                if (org.ret !== 1 || org.packet) {org.ret = RET_ERR; return}
                const dot = this.world.getOrgIdx(org.offset + DIR[abs(ax) % 8]);
                if (dot < 0) {org.ret = RET_ERR; return}
                this.removeOrg(org.packet = this.orgsAndMolsRef[dot]);
                return;
            }

            case CODE_CMD_OFFS + 51: {// put
                ++line;
                if (!org.packet) {org.ret = RET_ERR; return}
                if (this.orgsAndMols.full) {org.ret = RET_ERR; return}
                const offset = org.offset + DIR[abs(ax) % 8];
                const dot    = this.world.getOrgIdx(offset);
                if (dot > -1 || offset < 0 || offset > MAX_OFFS) {org.ret = RET_ERR; return}
                this.createOrg(offset, org.packet.isOrg ? org.packet : null, org.packet.code);
                this.db && this.db.put(org.packet);
                org.packet = null;
                return;
            }

            case CODE_CMD_OFFS + 52:  // offs
                ++line;
                ax = org.offset;
                return;

            case CODE_CMD_OFFS + 53:  // color
                line++;
                const newAx = abs(ax);
                org.color   = (newAx < ORG_MIN_COLOR ? ORG_MIN_COLOR : newAx) % 0xffffff;
                return;
        }
    }

    /**
     * Is called at the end of run() method to do post processing
     * @override
     */
    // TODO: move it to plugin
    afterRun() {
        //
        // Updates status line at the top of screen
        //
        const ts = Date.now();
        if (ts - this.ts > 1000) {
            const orgAmount = this.orgs.items;
            this.world.title(`inps:${Math.round(((this.i / orgAmount) / (((ts - this.ts) || 1)) * 1000))} orgs:${orgAmount} gen:${this.population}`);
            this.ts = ts;
            this.i  = 0;

            if (orgs.items < 1) {this.createOrgs()}
        }
    }

    /**
     * Creates one organism or molecule depending on isOrg parameter. In case
     * of organism extends it with additional properties like offset, color,...
     * @param {Number} offset Offset in a world
     * @param {Uint8Array} code Code to set
     * @param {Boolean} isOrg Organism or molecule
     * @override
     */
    createOrg (offset, code, isOrg = false) {
        const orgsAndMols = this.orgsAndMols;
        const org = super.createOrg(isOrg ? this.orgs.freeIndex : orgsAndMols.freeIndex, code, !isOrg);
        //
        // Extends organism properties
        //
        org.offset = offset;
        if (isOrg) {
            org.color  = Config.ORG_MIN_COLOR;
            org.packet = null;
            org.energy = this.code.length * Config.energyMultiplier
        }

        orgsAndMols.add(org);
        this.world.org(offset, org);

        return org;
    }

    /**
     * Removes organism from the world totally. Places "packet" organism
     * instead original if exists on the same position.
     * @param {Organism} org Organism to remove
     * @override
     */
    removeOrg(org) {
        const offset = org.offset;
        const packet = org.packet;

        if (org.isOrg) {
            this._removeFromOrgMolArr(org.molIndex);
            super.removeOrg(org);
        }
        org.energy = 0;
        org.isOrg  = false;
        this.world.empty(offset);
        packet && this.createOrg(offset, packet);
    }

    createOrgs() {
        const world = this.world;
        const cfg   = Config;
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
                const org = this.createOrg(offset, this._createMolCode());
                this.db && this.db.put(org);
            }
        }

        const code  = Config.codeLuca;
        let orgs    = Config.orgLucaAmount;
        while (orgs-- > 0) {
            const offset = rand(MAX_OFFS);
            if (world.getOrgIdx(offset) > -1) {orgs++; continue}
            const luca = this.createOrg(offset, null, code.slice(), true);
            this.db && this.db.put(luca);
        }
    }

    _removeFromOrgMolArr(index) {
        const movedOrg = this.orgsAndMols.del(index);
        if (movedOrg) {
            movedOrg.molIndex = index;
            this.world.setItem(movedOrg.offset, index);
        }
    }

    /**
     * Generates random code and code based on organism parts
     * @returns {Array}
     * @private
     */
    _createMolCode() {
        const size = Config.molCodeSize;
        if (Math.random() > .5) {
            const code = new Uint8Array(size);
            for (let i = 0; i < size; i++) {code[i] = Mutations.randCmd()}
            return code;
        }
        const code  = Config.codeLuca;
        const len   = code.length;
        const start = Math.floor(Math.random() * (len - size));
        return code.slice(start, start + size);
    }

    /**
     * Is called on pressing one of arrow buttons. Scrolls world inside canvas
     * to appropriate direction till the it's edge and stops at the end or
     * beginning.
     * @param {MouseEvent} e
     */
    // TODO: this method should be in World class
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

module.exports = BioVM;