/**
 * Extension of VM class. Adds biological and physical related commands into the "line"
 * language like "join", "split", "see", "step" and so on. Creates organisms, molecules,
 * world with canvas and html elements.
 * 
 * @author flatline
 */
const Helper                = require('./../common/Helper');
const Config                = require('./../Config');
const VM                    = require('./VM');
const Mutations             = require('./Mutations');
const World                 = require('./World');
const FastArray             = require('./../common/FastArray');

const rand                  = Helper.rand;
const RET_OK                = Config.CODE_RET_OK;
const RET_ERR               = Config.CODE_RET_ERR;
const ORG_CODE_MAX_SIZE     = Config.orgMaxCodeSize;
const IS_ORG_ID             = Config.CODE_ORG_ID;
const DIR                   = Config.DIR;
const WIDTH                 = Config.WORLD_WIDTH - 1;
const HEIGHT                = Config.WORLD_HEIGHT - 1;
const WIDTH1                = WIDTH + 1;
const HEIGHT1               = HEIGHT + 1;
const LINE_OFFS             = HEIGHT * WIDTH1;
const MAX_OFFS              = WIDTH1 * HEIGHT1 - 1;     // We need -1 to prevent using offset >= MAX_OFFS ... instead offset > MAX_OFFS
const ORG_MIN_COLOR         = Config.ORG_MIN_COLOR;
const CODE_8_BIT_MASK       = Config.CODE_8_BIT_MASK;
const CODE_8_BIT_RESET_MASK = Config.CODE_8_BIT_RESET_MASK;
//
// Biological commands
//
const JOIN   = Config.CODE_CMDS.JOIN;
const SPLIT  = Config.CODE_CMDS.SPLIT;
const STEP   = Config.CODE_CMDS.STEP;
const SEE    = Config.CODE_CMDS.SEE;
const SAY    = Config.CODE_CMDS.SAY;
const LISTEN = Config.CODE_CMDS.LISTEN;
const NREAD  = Config.CODE_CMDS.NREAD;
const NSPLIT = Config.CODE_CMDS.NSPLIT;
const GET    = Config.CODE_CMDS.GET;
const PUT    = Config.CODE_CMDS.PUT;
const OFFS   = Config.CODE_CMDS.OFFS;
const COLOR  = Config.CODE_CMDS.COLOR;
const ANAB   = Config.CODE_CMDS.ANAB;
const CATAB  = Config.CODE_CMDS.CATAB;
const FIND   = Config.CODE_CMDS.FIND;
const MOVE   = Config.CODE_CMDS.MOVE;
const MOLS   = Config.CODE_CMDS.MOLS;

class BioVM extends VM {
    /**
     * Returns maximum amount of organisms only according to config and amount of molecules
     * @return {Number} max amount
     */
    static _orgsAmount() {return Math.round(Config.molAmount * Config.molCodeSize / (Config.CODE_LUCA.length || 1)) + Config.orgAmount + 1}

    /**
     * Returns maximum amount of molecules and organisms according to config
     * @return {Number} max amount
     */
    static _orgsMolsAmount() {return Config.molAmount + Config.orgAmount + 1}

    constructor() {
        super(BioVM._orgsAmount());

        this.orgsMols   = new FastArray(BioVM._orgsMolsAmount());
        this.world      = new World({scroll: this._onScroll.bind(this)});
        this.freq       = new Int32Array(Config.worldFrequency);
        //
        // Amount of molecules + organisms should not be greater then amount of dots in a world
        //
        if (BioVM._orgsAmount() + BioVM._orgsMolsAmount() > WIDTH * HEIGHT - 1) {throw Error('Amount of molecules and organisms is greater then amount of dots in a world. Decrease "molAmount" and "orgAmount" configs')}
        this.addOrgs();
        this.addMols();
    }

    destroy() {
        super.destroy();

        this.orgsMols.destroy();
        this.world.destroy();

        this.orgsMols = null;
        this.world    = null;
    }

    /**
     * Returns "line" language version
     */
    get version() {return '2.0'}

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
            this.delOrg(org);
            this.addOrg(org.offset, org.code);
        }
        org.energy--;
    }

    /**
     * Runs additional command, which is not a part of standart commands
     * like "add", "inc", "mul", "func", "ret", "end", "ifxx", ...
     * @param {Organism} org Current organism
     * @param {Number} cmd Command to run
     * @override
     */
    runCmd(org, cmd) {
        // eslint-disable-next-line default-case
        switch (cmd) {
            case JOIN: {
                ++org.line;
                const offset = org.offset + DIR[Math.abs(org.ax) % 8];
                const dot    = this.world.getOrgIdx(offset);
                if (dot < 0) {org.ret = RET_ERR; return}
                const nearOrg = this.orgsMols.ref()[dot];
                if (nearOrg.code.length + org.code.length > ORG_CODE_MAX_SIZE) {org.ret = RET_ERR; return}
                org.code = org.code.push(nearOrg.code);
                nearOrg.energy && (org.energy += nearOrg.energy);
                //
                // Important: joining new commands into the script may break it, because it's
                // offsets, stack and context may be invalid. Generally, we have to compile
                // it after join. But this process resets stack and current running script line
                // to zero line and script start running from the beginning. To fix this we 
                // add any joined command to the end of script and skip compile. So, next
                // line should not be uncommented:
                // org.compile();
                //
                this.delOrg(nearOrg);
                org.ret = RET_OK;
                return;
            }

            case SPLIT: {
                ++org.line;
                if (this.orgsMols.full) {org.ret = RET_ERR; return}
                const offset  = org.offset + DIR[Math.abs(org.ret) % 8];
                if (offset < 0 || offset > MAX_OFFS) {org.ret = RET_ERR; return}
                const dot     = this.world.getOrgIdx(offset);
                if (dot > -1) {org.ret = RET_ERR; return} // organism on the way
                const code = org.code;
                const ax   = this._mol2Offs(code, org.ax);
                const bx   = this._mol2Offs(code, org.bx);
                if (ax < 0 || ax > code.length || bx <= ax) {org.ret = RET_ERR; return}
                const newCode = code.subarray(ax, bx);
                org.code = code.splice(ax, bx - ax);
                if (newCode.length < 1 || org.ret === IS_ORG_ID && this.orgs.full) {org.ret = RET_ERR; return}
                //
                // TODO: This is bad idea to hardcode IS_ORG_ID into organism. Because this mechanism
                // TODO: should be esupported by organism from parent to child
                //
                const clone   = this.addOrg(offset, newCode, org.ret === IS_ORG_ID);
                // this.db && this.db.put(clone, org);
                if (Config.codeMutateEveryClone > 0 && rand(Config.codeMutateEveryClone) === 0 && clone.energy) {
                    Mutations.mutate(clone);
                }
                if (org.code.length < 1) {this.delOrg(org); break}
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

            case STEP: {
                ++org.line;
                org.energy -= (Math.floor(org.code.length * Config.energyStepCoef) + (org.packet ? Math.floor(org.packet.code.length * Config.energyStepCoef) : 0));
                let offset = org.offset + DIR[Math.abs(org.ax) % 8];
                if (offset < -1) {offset = LINE_OFFS + org.offset}
                else if (offset > MAX_OFFS) {offset = org.offset - LINE_OFFS}
                if (this.world.getOrgIdx(offset) > -1) {org.ret = RET_ERR; return}
                this.world.moveOrg(org, offset);
                org.ret = RET_OK;
                return;
            }

            case SEE: {
                ++org.line;
                const offset = org.offset + org.ax;
                if (offset < 0 || offset > MAX_OFFS) {org.ax = 0; return}
                const dot = this.world.getOrgIdx(offset);
                const mol = this.orgsMols.ref()[dot];
                org.ax = (dot < 0 ? 0 : mol.color || this._molColor(mol));
                return;
            }

            case SAY: {
                ++org.line;
                const freq = Math.abs(org.bx) % Config.worldFrequency;
                this.freq[freq] = org.ax;
                org.freq = freq;
                return;
            }

            case LISTEN:
                ++org.line;
                org.ax = this.freq[Math.abs(org.bx) % Config.worldFrequency];
                return;

            case NREAD: {
                ++org.line;
                const offset = org.offset + DIR[Math.abs(org.ax) % 8];
                const dot = this.world.getOrgIdx(offset);
                if (dot < 0) {org.ret = RET_ERR; return}
                const nearOrg = this.orgsMols.ref()[dot];
                org.ax  = (nearOrg.code[org.bx] & CODE_8_BIT_RESET_MASK) || 0;
                org.ret = RET_OK;
                return;
            }

            case NSPLIT: {
                ++org.line;
                if (this.orgsMols.full) {org.ret = RET_ERR; return}
                const offset  = org.offset + DIR[Math.abs(org.ret) % 8];
                const dot     = this.world.getOrgIdx(offset);
                if (dot < 0) {org.ret = RET_ERR; return}
                const dOffset = this._freePos(org.offset);
                const dDot    = this.world.getOrgIdx(dOffset);
                if (dDot > -1) {org.ret = RET_ERR; return}
                const nearOrg = this.orgsMols.ref()[dot];
                const from    = this._mol2Offs(org.ax);
                const to      = this._mol2Offs(org.bx);
                if (from > to || from < 0 || to < 0) {org.ret = RET_ERR; return}
                const newCode = nearOrg.code.subarray(from, to);
                nearOrg.code  = nearOrg.code.splice(from, to);
                if (newCode.length < 1) {org.ret = RET_ERR; return}
                this.addOrg(dOffset, newCode);
                // const cutOrg  = this.addOrg(dOffset, newCode);
                // this.db && this.db.put(cutOrg, nearOrg);
                if (nearOrg.code.length < 1) {this.delOrg(nearOrg)}
                if (org.code.length < 1) {this.delOrg(org); break}
                org.ret = RET_OK;
                return;
            }

            case GET: {
                ++org.line;
                if (org.ret !== 1 || org.packet) {org.ret = RET_ERR; return}
                const dot = this.world.getOrgIdx(org.offset + DIR[Math.abs(org.ax) % 8]);
                if (dot < 0) {org.ret = RET_ERR; return}
                this.delOrg(org.packet = this.orgsMols.ref()[dot]);
                return;
            }

            case PUT: {
                ++org.line;
                if (!org.packet) {org.ret = RET_ERR; return}
                if (this.orgsMols.full) {org.ret = RET_ERR; return}
                const offset = org.offset + DIR[Math.abs(org.ax) % 8];
                const dot    = this.world.getOrgIdx(offset);
                if (dot > -1 || offset < 0 || offset > MAX_OFFS) {org.ret = RET_ERR; return}
                this.addOrg(offset, org.packet.code, !!org.packet.energy);
                // this.db && this.db.put(org.packet);
                org.packet = null;
                return;
            }

            case OFFS:
                ++org.line;
                org.ax = org.offset;
                return;

            case COLOR: {
                ++org.line;
                const newAx = Math.abs(org.ax);
                org.color   = (newAx < ORG_MIN_COLOR ? ORG_MIN_COLOR : newAx) % 0xffffff;
                return;
            }

            case ANAB: {
                ++org.line;
                let   code      = org.code;
                const m1Offs    = this._mol2Offs(code, org.ax);
                const m2Offs    = this._mol2Offs(code, org.bx);
                if (m1Offs > m2Offs || m1Offs < 0 || m2Offs < 0 || m1Offs >= m2Offs) {org.ret = RET_ERR; return}
                const m1EndOffs = this._molLastOffs(code, m1Offs);
                const m2EndOffs = this._molLastOffs(code, m2Offs);
                const cutCode   = code.subarray(m2Offs, m2EndOffs + 1);
                //
                // Important! We assume that this code change does not affect main
                // code. Only food part. This is why we dont call org.compile()
                //
                code = code.splice(m2Offs, m2EndOffs - m2Offs + 1);
                code = code.splice(m1EndOffs + 1, 0, cutCode);
                org.energy -= ((m2EndOffs - m2Offs + m1EndOffs - m1Offs + 2) * Config.energyMultiplier);
                code[m1EndOffs] &= CODE_8_BIT_RESET_MASK;
                org.code = code;
                org.ret  = RET_OK;
                return;
            }

            case CATAB: {
                ++org.line;
                const code    = org.code;
                const ax      = this._mol2Offs(code, org.ax);
                const axEnd   = this._molLastOffs(code, ax);
                if (ax === axEnd || ax < 0) {org.ret = RET_ERR; return}
                const molSize = axEnd - ax + 1;
                code[ax + Math.floor(molSize / 2) - 1] |= CODE_8_BIT_MASK;
                org.energy += (molSize * Config.energyMultiplier);
                org.ret = RET_OK;
                return;
            }

            case FIND: {
                ++org.line;
                const code = org.code;
                const ax   = this._mol2Offs(code, org.ax);
                if (ax < 0) {org.ret = RET_ERR; return}
                const atom = code[ax];
                let   mol  = org.bx;
                const bx   = this._mol2Offs(code, mol);
                if (bx < 0 || bx < ax) {org.ret = RET_ERR; return}
                const ret  = this._mol2Offs(code, org.ret);
                if (ret < 0 || ret < bx) {org.ret = RET_ERR; return}
                const len  = code.length;

                loop: for (let i = bx; i <= ret; i++, mol++) {
                    //
                    // If first command of source molecule and first command of current molecule
                    // doesn't equal, then skip all commands till the last in current molecule
                    //
                    if (atom === code[i]) {
                        if (code[i] & CODE_8_BIT_MASK) {org.ax = mol; org.ret = RET_OK; return}
                        for (let j = i + 1, k = 1;; j++,k++) {
                            if (code[j] !== code[k]) {continue loop}
                            if (code[j] & CODE_8_BIT_MASK) {break}
                        }
                        org.ax  = mol;
                        org.ret = RET_OK;
                        return; 
                    // eslint-disable-next-line no-else-return
                    } else {
                        if (code[i] & CODE_8_BIT_MASK) {continue}
                        // eslint-disable-next-line no-empty
                        while((code[++i] & CODE_8_BIT_MASK) === 0 && i < len) {}
                    }
                }
                org.ret = RET_ERR;
                return;
            }

            case MOVE: {
                ++org.line;
                let    code     = org.code;
                const find0    = this._mol2Offs(code, org.ax);
                const find1    = this._molLastOffs(code, find0);
                if (find1 < find0) {org.ret = RET_ERR; return}
                const moveCode = code.slice(find0, find1 + 1);
                if (moveCode.length < 1) {org.ret = RET_ERR; return}
                const bx       = this._mol2Offs(code, org.bx);
                const newBx    = bx < 0 ? 0 : bx;
                const len      = find1 - find0 + 1;
                const offs     = newBx > find1 ? newBx - len : (newBx < find0 ? newBx : find0);
                if (find0 === offs) {org.ret = RET_OK; return}
                code = code.splice(find0, len);
                org.code = code = code.splice(offs, 0, moveCode);
                //
                // Important: moving new commands insie the script may break it, because it's
                // offsets, stack and context may be invalid. Generally, we have to compile
                // it after move. But this process resets stack and current running script line
                // to zero line and script start running from the beginning. To fix this we 
                // just assume that moving command doesn't belong to main (replicator) script
                // part and skip compile. So, next line should not be uncommented
                // org.compile();
                // line = 0;
                //
                org.ret = RET_OK;
                return;
            }

            case MOLS: {
                ++org.line;
                org.ax = this._molsAmount(org.code);
                // eslint-disable-next-line no-useless-return
                return;
            }
        }
    }

    /**
     * Is called at the end of run() method to do post processing
     * @override
     */
    afterRun() {
        if (this.orgs.items < 1) {this.addOrgs()}
    }

    /**
     * Creates one organism or molecule depending on isOrg parameter. In case
     * of organism extends it with additional properties like offset, color,...
     * @param {Number} offset Offset in a world
     * @param {Uint8Array} code Code to set
     * @param {Boolean} isOrg Organism or molecule
     * @override
     */
    addOrg (offset, code, isOrg = false) {
        const orgsMols = this.orgsMols;
        const org = super.addOrg(isOrg ? this.orgs.freeIndex : orgsMols.freeIndex, code, !isOrg);
        //
        // Extends organism properties
        //
        org.offset = offset;
        if (isOrg) {
            org.molIndex = orgsMols.freeIndex;
            org.color    = Config.orgColor;
            org.packet   = null;
            org.energy   = code.length * Config.energyMultiplier;
            org.compile();
        }

        orgsMols.add(org);
        this.world.org(offset, org, isOrg ? org.color : this._molColor(org));

        return org;
    }

    /**
     * Removes organism from the world totally. Places "packet" organism
     * instead original if exists on the same position.
     * @param {Organism} org Organism to remove
     * @override
     */
    delOrg(org) {
        if (org.hasOwnProperty('energy')) { // This is an organism
            this._delFromOrgsMolsArr(org.molIndex);
            super.delOrg(org);
        } else {
            this._delFromOrgsMolsArr(org.index);
        }
        org.energy = 0;
        this.world.empty(org.offset);
        //
        // Extracts all packet organisms recursively
        //
        let packet  = org.packet;
        const world = this.world;
        while (packet) {
            const offset = rand(MAX_OFFS);
            if (world.getOrgIdx(offset) > -1) {continue}
            this.addOrg(offset, packet.code, !!packet.energy);
            packet = packet.packet;
        }
    }

    /**
     * Creates organisms with amount specified in config
     */
    addOrgs() {
        const world = this.world;
        const code  = Config.CODE_LUCA;
        let orgs    = Config.orgAmount;
        while (orgs-- > 0) {
            const offset = rand(MAX_OFFS);
            if (world.getOrgIdx(offset) > -1) {orgs++; continue}
            this.addOrg(offset, this.split2Mols(code.slice()), true);
            // const luca = this.addOrg(offset, code.slice(), true);
            // this.db && this.db.put(luca);
        }
    }

    /**
     * Creates molecules with amount specified in config. Molecules should 
     * be created only once. They are always in a world (not disappear).
     */
    addMols() {
        const world   = this.world;
        const cfg     = Config;
        let molecules = cfg.molAmount;
        while (molecules-- > 0) {
            const offset = rand(MAX_OFFS);
            if (world.getOrgIdx(offset) > -1) {molecules++; continue}
            this.addOrg(offset, this._molCode());
            // const org = this.addOrg(offset, this._molCode());
            // this.db && this.db.put(org);
        }
    }

    /**
     * Splits raw code into molecules by adding first bit flag to every Config.molCodeSize offset
     * @param {Uint8Array} code Code we need to split
     * @return {Uint8Array} The same array, but with meta info inside (molecule separator)
     */
    split2Mols(code) {
        const size = Config.molCodeSize;
        const len  = code.length;
        let   i    = -1;
        
        while ((i += size) < len) {code[i] |= CODE_8_BIT_MASK}
        code[len - 1] |= CODE_8_BIT_MASK; // last atom must be marked

        return code;
    }

    /**
     * Removes organism or molecule from organisms and molecules array
     * @param {Number} index Organism or molecule index
     */
    _delFromOrgsMolsArr(index) {
        const movedOrg = this.orgsMols.del(index);
        if (movedOrg) {
            movedOrg.molIndex = index;
            this.world.setItem(movedOrg.offset, index);
        }
    }

    /**
     * Returns color of molecule by it's atoms
     * @param {Organism} mol Molecule
     * @return {Number} color Color in 0xRRGGBB format
     */
    _molColor(mol) {
        const code  = mol.code;
        const len   = code.length;
        const bits  = len > 3 ? Math.floor(21 / len) || Config.molColor : 8;
        const left  = 8 - bits;
        let   cBits = 0;
        let   color = 0;

        for (let i = 0; i < len; i++) {
            color |= ((((code[i] & CODE_8_BIT_RESET_MASK) << left) >>> left) << cBits);
            cBits += bits;
        }

        return color;
    }

    /**
     * Generates random code and code based on organism parts
     * @returns {Array}
     * @private
     */
    _molCode() {
        const size = Config.molCodeSize;
        if (Math.random() > .5) {
            const code = new Uint8Array(size);
            for (let i = 0; i < size; i++) {code[i] = Mutations.randCmd()}
            //
            // Sets last atom bit on
            //
            code[size - 1] |= Config.CODE_8_BIT_MASK;
            return code;
        }
        let   code  = Config.CODE_LUCA;
        const len   = code.length;
        const start = Math.floor(Math.random() * (len - size));
        code = code.slice(start, start + size);
        //
        // Sets last atom bit on
        //
        code[size - 1] |= Config.CODE_8_BIT_MASK;

        return code;
    }

    /**
     * Converts molecule index to absolute index in a code array.
     * @param {Uint8Array} code Code
     * @param {Number} molIndex Index of molecule
     * @return {Number|-1} index of first atom or -1 if no last atom found
     */
    _mol2Offs(code, molIndex) {
        let index = 0;
        for (let i = 0, len = code.length, len1 = len - 1; i < len; i++) {
            if ((code[i] & CODE_8_BIT_MASK)) {
                if (molIndex-- < 1) {return index}
                i < len1 && (index = i + 1);
            }
        }
        return index;
    }

    /**
     * Returns index of last atom in molecule in a code
     * @param {Uint8Array} code Code we a looking in
     * @param {Number} index Index of first atom in molecule
     */
    _molLastOffs(code, index) {
        // eslint-disable-next-line no-empty
        while ((code[index] & CODE_8_BIT_MASK) === 0) {index++}
        return index;
    }

    /**
     * Returns molecules amount for specified organism
     * @param {Uint8Array} code Organism code
     * @return {Number} Molecules amount
     */
    _molsAmount(code) {
        let mols = 0;
        for (let i = 0, len = code.length; i < len; i++) {(code[i] & CODE_8_BIT_MASK) && ++mols}
        return mols || (code.length > 0 ? 1 : 0);
    }
    
    /**
     * Returns free dot offset near specified offset
     * @param {Number} offset Absolute dot offset
     * @return {Number} Free dot offset or -1 if no free offset near specified
     */
    _freePos(offset) {
        const world = this.world;
        
        for (let i = 0; i < 8; i++) {
            if (world.getOrgIdx(offset + DIR[i++]) === -1) {
                return offset + DIR[i++];
            }
        }

        return -1;
    }

    /**
     * Is called on pressing one of arrow buttons. Scrolls world inside canvas
     * to appropriate direction till the it's edge and stops at the end or beginning.
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
            case 37: if ((world.viewX -= Config.worldScrollValue) < 0)    {world.viewX = 0;   this._onHScroll()}  break; // left
            case 39: if ((world.viewX += Config.worldScrollValue) >= row) {world.viewX = row; this._onHScroll()} break; // right
            case 38: if ((world.viewY -= Config.worldScrollValue) < 0)    {world.viewY = 0;   this._onVScroll(true)}  break; // up
            case 40: if ((world.viewY += Config.worldScrollValue) >= col) {world.viewY = col; this._onVScroll(false)} break; // down
            default: return;
        }

        let   offs     = world.viewOffs = world.viewY * Config.WORLD_WIDTH + world.viewX;
        const canvas   = world.canvas;
        const orgMol   = this.orgsMols.ref();
        //
        // Copy world's part into the canvas accodring to new scroll offsets
        //
        for (let y = 0, height = Config.WORLD_CANVAS_HEIGHT; y < height; y++) {
            const yOffs = y * width;
            for (let x = 0; x < width; x++) {
                const org = world.getOrgIdx(offs++);
                canvas.dot(yOffs + x, org === -1 ? 0x000000 : orgMol[org].color || this._molColor(orgMol[org]));
            }
            offs += row;
        }
        world.viewX1    = world.viewX + width - 1;
        world.viewOffs1 = world.viewOffs + (Config.WORLD_CANVAS_HEIGHT - 1) * Config.WORLD_WIDTH + row + Config.WORLD_CANVAS_WIDTH - 1;

        return true;
    }

    // TODO: not done
    _onHScroll() {
        
    }

    // TODO: not done
    _onVScroll() {

    }
}

module.exports = BioVM;