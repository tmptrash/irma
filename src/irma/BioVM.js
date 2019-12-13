/**
 * Extension of VM class. Adds biological and physical related commands into the "line"
 * language like "join", "split", "see", "step" and so on. Creates organisms, molecules,
 * world with canvas and html elements.
 * 
 * @author flatline
 */
const Helper                = require('./../common/Helper');
const Config                = require('./../Config');
const Molecule              = require('./Molecule');
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
const GET    = Config.CODE_CMDS.GET;
const PUT    = Config.CODE_CMDS.PUT;
const OFFS   = Config.CODE_CMDS.OFFS;
const COLOR  = Config.CODE_CMDS.COLOR;
const ANAB   = Config.CODE_CMDS.ANAB;
const CATAB  = Config.CODE_CMDS.CATAB;
const MOVE   = Config.CODE_CMDS.MOVE;
const MOL    = Config.CODE_CMDS.MOL;
const RMOL   = Config.CODE_CMDS.RMOL;
const LMOL   = Config.CODE_CMDS.LMOL;
const CMOL   = Config.CODE_CMDS.CMOL;

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
            this.addMol(org.offset, org.code);
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
                const dot    = this.world.index(offset);
                if (dot < 0) {org.ret = RET_ERR; return}
                const nearOrg = this.orgsMols.get(dot);
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
                nearOrg.hasOwnProperty('energy') ? this.delOrg(nearOrg) : this.delMol(nearOrg);
                org.ret = RET_OK;
                return;
            }

            //
            // TODO: This is bad idea to hardcode IS_ORG_ID into language. Because this mechanism
            // TODO: should be supported by organism from parent to child
            //
            case SPLIT: {
                ++org.line;
                if (this.orgsMols.full || org.ret === IS_ORG_ID && this.orgs.full) {org.ret = RET_ERR; return} // mols and orgs maximum was reached
                const offset  = org.offset + DIR[Math.abs(org.ret) % 8];
                if (offset < 0 || offset > MAX_OFFS) {org.ret = RET_ERR; return}
                const dot     = this.world.index(offset);
                if (dot > -1) {org.ret = RET_ERR; return} // something on the way
                const code    = org.code;
                const idx0    = org.mol;
                const idx1    = this._molLastOffs(code, idx0) + 1;
                const newCode = code.subarray(idx0, idx1);
                if (newCode.length < 1) {org.ret = RET_ERR; return}
                org.code      = code.splice(idx0, idx1 - idx0);
                const clone   = org.ret === IS_ORG_ID ? this.addOrg(offset, newCode, org.energy = Math.floor(org.energy / 2)) : this.addMol(offset, newCode);
                // this.db && this.db.put(clone, org);
                if (Config.codeMutateEveryClone > 0 && rand(Config.codeMutateEveryClone) === 0 && clone.energy) {Mutations.mutate(clone)}
                if (org.code.length < 1) {this.delOrg(org)}
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
                if (this.world.index(offset) > -1) {org.ret = RET_ERR; return}
                this.world.moveOrg(org, offset);
                org.ret = RET_OK;
                return;
            }

            case SEE: {
                ++org.line;
                const offset = org.offset + org.ax;
                if (offset < 0 || offset > MAX_OFFS) {org.ax = 0; return}
                const dot = this.world.index(offset);
                const mol = this.orgsMols.get(dot);
                org.ax = (dot < 0 ? 0 : mol.color || this._molColor(mol.code));
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
                const dot = this.world.index(offset);
                if (dot < 0) {org.ret = RET_ERR; return}
                const nearOrg  = this.orgsMols.get(dot);
                const nearCode = nearOrg.code;
                let   bx       = org.bx;
                if (bx < 0) {bx = 0}
                if (bx >= nearCode.length) {bx = nearCode.length - 1}
                for (let i = bx - 1;; i--) {if ((nearCode[i] & CODE_8_BIT_MASK) > 0 || i < 0) {bx = i + 1; break}} // find first atom of molecule
                const mem  = org.mem;
                const mLen = mem.length - 1;
                for (let i = bx, m = org.memPos;; i++, m++) {
                    mem[m] = nearCode[i];
                    if ((nearCode[i] & CODE_8_BIT_MASK) > 0) {break}
                    if (m > mLen) {m = -1}
                }
                org.ret = RET_OK;
                return;
            }

            case GET: {
                ++org.line;
                if (org.ret !== 1 || org.packet) {org.ret = RET_ERR; return}
                const dot = this.world.index(org.offset + DIR[Math.abs(org.ax) % 8]);
                if (dot < 0) {org.ret = RET_ERR; return}
                (org.packet = this.orgsMols.get(dot)).hasOwnProperty('energy') ? this.delOrg(org.packet) : this.delMol(org.packet);
                return;
            }

            case PUT: {
                ++org.line;
                if (!org.packet) {org.ret = RET_ERR; return}
                if (this.orgsMols.full) {org.ret = RET_ERR; return}
                const offset = org.offset + DIR[Math.abs(org.ax) % 8];
                const dot    = this.world.index(offset);
                if (dot > -1 || offset < 0 || offset > MAX_OFFS) {org.ret = RET_ERR; return}
                org.packet.hasOwnProperty('energy') ? this.addOrg(offset, org.packet.code, org.packet.energy) : this.addMol(offset, org.packet.code);
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
                const m1Offs    = org.mol;
                let   m2Offs    = org.ax;
                for (let i = org.ax - 1;; i--) {if ((code[i] & CODE_8_BIT_MASK) > 0 || i < 0) {m2Offs = i + 1; break}} // find first atom of molecule
                if (m1Offs === m2Offs) {org.ret = RET_ERR; return}
                const m1EndOffs = this._molLastOffs(code, m1Offs);
                const m2EndOffs = this._molLastOffs(code, m2Offs);
                const cutCode   = code.subarray(m2Offs, m2EndOffs + 1);
                //
                // Important! We assume that this code change does not affect main
                // code. Only food part. This is why we dont call org.compile()
                //
                code            = code.splice(m2Offs, m2EndOffs - m2Offs + 1);
                code            = code.splice(m1EndOffs + 1, 0, cutCode);
                org.energy     -= ((m2EndOffs - m2Offs + m1EndOffs - m1Offs + 2) * Config.energyMultiplier);
                code[m1EndOffs] &= CODE_8_BIT_RESET_MASK;
                org.code        = code;
                org.ret         = RET_OK;
                return;
            }

            case CATAB: {
                ++org.line;
                const code    = org.code;
                const mol     = org.mol;
                const molEnd  = this._molLastOffs(code, mol);
                if (mol === molEnd) {org.ret = RET_ERR; return}
                let   cutPos  = org.bx;
                const molSize = molEnd - mol + 1;
                if (cutPos) {cutPos = mol + Math.floor(molSize / 2) - 1}
                code[cutPos] |= CODE_8_BIT_MASK;
                org.energy += (molSize * Config.energyMultiplier);
                org.ret = RET_OK;
                return;
            }

            case MOVE: {
                ++org.line;
                let    code    = org.code;
                const find0    = this._mol2Offs(code, org.ax);
                const find1    = this._molLastOffs(code, find0);
                if (find1 < find0) {org.ret = RET_ERR; return}
                const moveCode = code.slice(find0, find1 + 1);
                if (moveCode.length < 1) {org.ret = RET_ERR; return}
                const bx       = Math.min(this._molLastOffs(code, this._mol2Offs(code, org.bx)) + 1, code.length);
                const len      = find1 - find0 + 1;
                const offs     = bx > find1 ? bx - len : (bx < find0 ? bx : find0);
                if (find0 === offs) {org.ret = RET_OK; return}
                code           = code.splice(find0, len);
                org.code       = code = code.splice(offs, 0, moveCode);
                org.energy    -= Config.energyMultiplier;
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

            case MOL: {
                ++org.line;
                const mol = org.mol;
                org.ax    = mol;
                org.bx    = this._molLastOffs(org.code, mol) - mol;
                return;
            }

            case RMOL: {
                ++org.line;
                org.mol++;
                // TODO: don't forget about one atom molecules!
                if ((org.idx = this._molLastOffs(org.code, org.idx) + 1) >= org.code.length) {
                    org.idx = org.mol = 0;
                }
                return;
            }

            case LMOL: {
                ++org.line;
                org.mol--;
                // TODO:
                //if ((org.idx = this._molLastOffs(org.code, org.idx) + 1) >= org.code.length) {
                //    org.idx = org.mol = 0;
                //}
                return;
            }

            case CMOL: {
                ++org.line;
                const code = org.code;
                const mem  = org.mem;
                const mLen = mem.length - 1;
                for (let i = org.mol, m = org.memPos;; i++, m++) {
                    mem[m] = code[i];
                    if ((code[i] & CODE_8_BIT_MASK) > 0) {break}
                    if (m > mLen) {m = -1}
                }
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
     * @param {Number} energy Amount of organism energy to start with
     * @override
     */
    addOrg (offset, code, energy) {
        const orgsMols = this.orgsMols;
        const org = super.addOrg(this.orgs.freeIndex, code);
        //
        // Extends organism properties
        //
        org.offset   = offset;
        org.molIndex = orgsMols.freeIndex;
        org.color    = Config.orgColor;
        org.packet   = null;
        org.energy   = energy;
        org.mol      = 0;
        org.compile();

        orgsMols.add(org);
        this.world.org(offset, org);

        return org;
    }

    /**
     * Removes organism from the world totally. Places "packet" organism
     * instead original if exists on the same position.
     * @param {Organism} org Organism to remove
     * @override
     */
    delOrg(org) {
        this._delFromOrgsMolsArr(org.molIndex);
        super.delOrg(org);
        org.energy = 0;
        //
        // Extracts all packet organisms recursively
        //
        let packet  = org.packet;
        const world = this.world;
        while (packet) {
            const offset = rand(MAX_OFFS);
            if (world.index(offset) > -1) {continue}
            packet.hasOwnProperty('energy') ? this.addOrg(offset, packet.code, packet.energy) : this.addMol(offset, packet.code);
            packet = packet.packet;
        }
    }

    /**
     * Creates one molecule. Molecule is an instance of Organism class also, but
     * it contains only few fields like offset and code.
     * @param {Number} offset Offset in a world
     * @param {Uint8Array} code Code to set
     */
    addMol(offset, code) {
        const orgsMols = this.orgsMols;
        const mol      = new Molecule(offset, orgsMols.freeIndex, code);

        orgsMols.add(mol);
        this.world.mol(offset, mol, this._molColor(mol.code));

        return mol;
    }

    /**
     * Removes molecule from the world totally. Places "packet" organism or
     * molecule instead original if exists on the same position.
     * @param {Molecule} mol Molecule to remove
     */
    delMol(mol) {
        this._delFromOrgsMolsArr(mol.index);
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
            if (world.index(offset) > -1) {orgs++; continue}
            this.addOrg(offset, this.split2Mols(code.slice()), code.length * Config.energyMultiplier);
            // const luca = this.addOrg(offset, code.slice(), code.length * Config.energyMultiplier);
            // this.db && this.db.put(luca);
        }
        this.population++;
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
            if (world.index(offset) > -1) {molecules++; continue}
            this.addMol(offset, this._molCode());
            // const org = this.addMol(offset, this._molCode());
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
        const org      = this.orgsMols.get(index);
        const movedOrg = this.orgsMols.del(index);
        if (movedOrg) {
            movedOrg.hasOwnProperty('energy') ? movedOrg.molIndex = index : movedOrg.index = index;
            this.world.setItem(movedOrg.offset, index);
        }
        this.world.empty(org.offset);
    }

    /**
     * Returns color of molecule by it's atoms
     * @param {Uint8Array} code Code
     * @return {Number} color Color in 0xRRGGBB format
     */
    _molColor(code) {
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
        if (Math.random() <= Config.molRandomAtomPercent) {
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
        const start = size * Math.floor(Math.random() * Math.ceil(len / 4));
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
        for (let i = 0, len = code.length; i < len; i++) {
            if ((code[i] & CODE_8_BIT_MASK)) {
                if (molIndex-- < 1) {return index}
                index = i + 1;
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
        const len = code.length;
        // eslint-disable-next-line no-empty
        while ((code[index] & CODE_8_BIT_MASK) === 0 && index < len) {index++}
        return index;
    }
    
    /**
     * Returns free dot offset near specified offset
     * @param {Number} offset Absolute dot offset
     * @return {Number} Free dot offset or -1 if no free offset near specified
     */
    _freePos(offset) {
        const world = this.world;
        
        for (let i = 0; i < 8; i++) {
            if (world.index(offset + DIR[i++]) === -1) {
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
                const org = world.index(offs++);
                canvas.dot(yOffs + x, org === -1 ? 0x000000 : orgMol[org].color || this._molColor(orgMol[org].code));
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