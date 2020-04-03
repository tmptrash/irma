/**
 * Extension of VM class. Adds biological and physical related commands into the "line"
 * language like "join", "split", "see", "step" and so on. Creates organisms, molecules,
 * world with canvas and html elements.
 * 
 * @author flatline
 */
const Package               = require('./../../package.json');
const Helper                = require('./../common/Helper');
const Config                = require('./../Config');
const Molecule              = require('./Molecule');
const VM                    = require('./VM');
const Mutations             = require('./Mutations');
const World                 = require('./World');
const FastArray             = require('./../common/FastArray');
const Compiler              = require('./Compiler');

const rand                  = Helper.rand;
const RE_OK                 = Config.CODE_RE_OK;
const RE_ERR                = Config.CODE_RE_ERR;
const RE_SPECIAL            = Config.CODE_RE_SPECIAL;
const ORG_CODE_MAX_SIZE     = Config.ORG_MAX_CODE_SIZE;
const IS_ORG_ID             = Config.CODE_ORG_ID;
const DIRS                  = Config.DIRS;
const WIDTH                 = Config.WORLD_WIDTH - 1;
const HEIGHT                = Config.WORLD_HEIGHT - 1;
const WIDTH1                = WIDTH + 1;
const HEIGHT1               = HEIGHT + 1;
const LINE_OFFS             = HEIGHT * WIDTH1;
const MAX_OFFS              = WIDTH1 * HEIGHT1 - 1;     // We need -1 to prevent using offset >= MAX_OFFS ... instead offset > MAX_OFFS
const ORG_MIN_COLOR         = Config.ORG_MIN_COLOR;
const MASK8                 = Config.CODE_8_BIT_MASK;
const MASK8R                = Config.CODE_8_BIT_RESET_MASK;
const ORG_MAX_MEM_SIZE      = Config.ORG_MAX_MEM_SIZE;
//
// Biological commands
//
const JOIN                  = Config.CODE_CMDS.JOIN;
const SPLIT                 = Config.CODE_CMDS.SPLIT;
const STEP                  = Config.CODE_CMDS.STEP;
const SEE                   = Config.CODE_CMDS.SEE;
const SAY                   = Config.CODE_CMDS.SAY;
const LISTEN                = Config.CODE_CMDS.LISTEN;
const NREAD                 = Config.CODE_CMDS.NREAD;
const GET                   = Config.CODE_CMDS.GET;
const PUT                   = Config.CODE_CMDS.PUT;
const OFFS                  = Config.CODE_CMDS.OFFS;
const COLOR                 = Config.CODE_CMDS.COLOR;
const ANAB                  = Config.CODE_CMDS.ANAB;
const CATAB                 = Config.CODE_CMDS.CATAB;
const MOL                   = Config.CODE_CMDS.MOL;
const MMOL                  = Config.CODE_CMDS.MMOL;
const SMOL                  = Config.CODE_CMDS.SMOL;
const RMOL                  = Config.CODE_CMDS.RMOL;
const LMOL                  = Config.CODE_CMDS.LMOL;
const CMOL                  = Config.CODE_CMDS.CMOL;
const MCMP                  = Config.CODE_CMDS.MCMP;
const ASM                   = Config.CODE_CMDS.ASM;
const REAX                  = Config.CODE_CMDS.REAX;
const DIR                   = Config.CODE_CMDS.DIR;
const LHEAD                 = Config.CODE_CMDS.LHEAD;
const RHEAD                 = Config.CODE_CMDS.RHEAD;

class BioVM extends VM {
    /**
     * Returns maximum amount of organisms only according to config and amount of molecules
     * @return {Number} max amount
     */
    static _orgsAmount() {
        //
        // We need to convert string to byte code representation to 
        // remove all comments. This is how we obtain real amount of
        // instructions in LUCA's code
        //
        const bCode = Compiler.toByteCode(Config.LUCAS[0].code);
        return Math.round(Config.molAmount * Config.molCodeSize / (bCode.length || 1)) + Config.LUCAS.length;
    }

    /**
     * Returns maximum amount of molecules and organisms according to config
     * @return {Number} max amount
     */
    static _orgsMolsAmount() {return Config.molAmount + Config.LUCAS.length + 1}

    /**
     * Is called when atom stay molecule-separator or was a separator
     * @param {Number} index Index of atom, which was changed
     * @param {Boolean} isLast true if current atom is the last atom in molecule
     * @abstract
     */
    updateAtom() {}

    constructor(options) {
        super(BioVM._orgsAmount() + 1);

        this.orgsMols = new FastArray(BioVM._orgsMolsAmount() + 1);
        this.world    = new World({...options, scroll: this._onScroll.bind(this)});
        this.freq     = new Int32Array(Config.worldFrequency);
        //
        // Amount of molecules + organisms should not be greater then amount of dots in a world
        //
        if (BioVM._orgsAmount() + BioVM._orgsMolsAmount() > WIDTH * HEIGHT - 1) {throw Error('Amount of molecules and organisms is greater then amount of dots in a world. Decrease "molAmount" and "LUCAS.length" configs')}
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
    get version() {return Package.version}

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
        if (org.energy < 0 || (Config.orgMaxAge > 0 && org.age > Config.orgMaxAge)) {
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
                const offset  = org.offset + org.dir;
                const dot     = this.world.index(offset);
                if (dot < 0) {org.re = RE_ERR; return}
                const nearOrg = this.orgsMols.get(dot);
                const nearLen = nearOrg.code.length;
                const code    = org.code;
                if (nearLen + code.length > ORG_CODE_MAX_SIZE) {org.re = RE_ERR; return}
                const idx     = this._molLastOffs(code, org.heads[org.head]) + 1;
                org.code      = code.splice(idx, 0, nearOrg.code);
                nearOrg.hasOwnProperty('energy') ? this.delOrg(nearOrg) : this.delMol(nearOrg);
                org.re        = nearLen;
                Compiler.compile(org, false);                 // Safe recompilation without loosing metadata
                Compiler.updateMetadata(org, idx, idx + nearLen, 1);
                return;
            }

            //
            // TODO: This is bad idea to hardcode IS_ORG_ID into language. Because this mechanism
            // TODO: should be supported by organism from parent to child
            //
            case SPLIT: {
                ++org.line;
                org.re        = RE_OK;
                // TODO: these checks may be removed if we don't change amount of atoms in a world
                if (this.orgsMols.full || org.mem[org.mPos] === IS_ORG_ID && this.orgs.full) {org.re = RE_ERR; return} // mols and orgs maximum was reached
                let offset    = org.offset + org.dir;
                if (offset < 0) {org.re = RE_SPECIAL; offset = LINE_OFFS + org.offset}
                else if (offset > MAX_OFFS) {org.re = RE_SPECIAL; offset = org.offset - LINE_OFFS}
                const dot     = this.world.index(offset);
                if (dot > -1) {org.re = RE_ERR; return} // something on the way
                const code    = org.code;
                let   idx0    = org.heads[org.head];
                let   idx1    = org.heads[org.head + 1 === org.heads.length ? 0 : org.head + 1];
                if (idx0 > idx1) {const tmp = idx0; idx1 = idx0; idx0 = tmp}
                if (idx1 < 0) {idx1 = 0}
                if (idx1 >= code.length) {idx1 = code.length - 1}
                idx1 = this._molLastOffs(code, idx1);
                const newCode = code.subarray(idx0, idx1 + 1);
                if (newCode.length < 1) {org.re = RE_ERR; return}
                org.code      = code.splice(idx0, idx1 - idx0 + 1);
                const clone   = org.mem[org.mPos] === IS_ORG_ID ? this.addOrg(org, offset, newCode, org.energy = Math.floor(org.energy / 2)) : this.addMol(offset, newCode);
                // this.db && this.db.put(clone, org);
                if (Config.codeMutateEveryClone > 0 && rand(Config.codeMutateEveryClone) === 0 && clone.energy) {Mutations.mutate(this, clone)}
                if (org.code.length < 1) {this.delOrg(org); return}
                Compiler.compile(org, false);               // Safe recompilation without loosing metadata
                Compiler.updateMetadata(org, idx0, idx1 + 1, -1);
                return;
            }

            case STEP: {
                ++org.line;
                org.re = RE_OK;
                org.energy -= (Math.floor(org.code.length * Config.energyStepCoef) + (org.packet ? Math.floor(org.packet.code.length * Config.energyStepCoef) : 0));
                let offset = org.offset + org.dir;
                if (offset < 0) {org.re = RE_SPECIAL; offset = LINE_OFFS + org.offset}
                else if (offset > MAX_OFFS) {org.re = RE_SPECIAL; offset = org.offset - LINE_OFFS}
                if (this.world.index(offset) > -1) {org.re = RE_ERR; return}
                this.world.moveOrg(org, offset);
                return;
            }

            case SEE: {
                ++org.line;
                const offset = org.offset + org.ax;
                if (offset < 0 || offset > MAX_OFFS) {org.ax = 0; return}
                const dot = this.world.index(offset);
                const mol = this.orgsMols.get(dot);
                org.ax = (dot < 0 ? 0 : mol.color || this.molColor(mol.code));
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

            // TODO: review this code
            case NREAD: {
                ++org.line;
                const offset = org.offset + org.dir;
                const dot = this.world.index(offset);
                if (dot < 0) {org.re = RE_ERR; return}
                const nearOrg  = this.orgsMols.get(dot);
                const nearCode = nearOrg.code;
                let   bx       = org.bx;
                if (bx < 0) {bx = 0}
                if (bx >= nearCode.length) {bx = nearCode.length - 1}
                for (let i = bx - 1;; i--) {if ((nearCode[i] & MASK8) > 0 || i < 0) {bx = i + 1; break}} // find first atom of molecule
                const mem  = org.mem;
                for (let i = bx, m = org.mPos;; i++, m++) {
                    if (m >= ORG_MAX_MEM_SIZE) {m = 0}
                    mem[m] = nearCode[i];
                    if ((nearCode[i] & MASK8) > 0) {break}
                }
                org.re = RE_OK;
                return;
            }

            case GET: {
                ++org.line;
                if (org.packet) {org.re = RE_ERR; return}
                const dot = this.world.index(org.offset + org.dir);
                if (dot < 0) {org.re = RE_ERR; return}
                (org.packet = this.orgsMols.get(dot)).hasOwnProperty('energy') ? this.delOrg(org.packet) : this.delMol(org.packet);
                return;
            }

            case PUT: {
                ++org.line;
                if (!org.packet) {org.re = RE_ERR; return}
                if (this.orgsMols.full) {org.re = RE_ERR; return}
                const offset = org.offset + org.dir;
                const dot    = this.world.index(offset);
                if (dot > -1 || offset < 0 || offset > MAX_OFFS) {org.re = RE_ERR; return}
                org.packet.hasOwnProperty('energy') ? this.addOrg(org.packet, offset, org.packet.code, org.packet.energy) : this.addMol(offset, org.packet.code);
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
                const m1Idx     = org.heads[org.head];
                //
                // Join current and next molecules into one
                //
                if (org.ax < 0) {
                    const m1EndIdx  = this._molLastOffs(code, m1Idx);
                    const m2Idx     = m1EndIdx + 1;
                    const m2EndIdx  = this._molLastOffs(code, m2Idx);
                    if (m1EndIdx === m2EndIdx || m2EndIdx >= code.length) {org.re = RE_SPECIAL; return}
                    if ((code[m1EndIdx] & MASK8) === 0) {org.re = RE_OK; return}
                    org.energy     -= ((m2EndIdx - m2Idx + m1EndIdx - m1Idx + 2) * Config.energyMetabolismCoef);
                    code[m1EndIdx] &= MASK8R;
                    this.updateAtom(m1EndIdx, false);
                    org.re          = RE_OK;
                    return;
                }
                //
                // Join current and molecule in ax into one
                //
                let   m2Idx     = 0;
                for (let i = org.ax - 1;; i--) {if ((code[i] & MASK8) > 0 || i < 0) {m2Idx = i + 1; break}} // find first atom of molecule
                if (m1Idx === m2Idx) {org.re = RE_ERR; return}
                const m1EndIdx  = this._molLastOffs(code, m1Idx);
                const m2EndIdx  = this._molLastOffs(code, m2Idx);
                const cutCode   = code.subarray(m2Idx, m2EndIdx + 1);
                code            = code.splice(m2Idx, m2EndIdx - m2Idx + 1);
                const insIdx    = m1EndIdx + 1;
                code            = code.splice(insIdx, 0, cutCode);
                if ((code[m1EndIdx] & MASK8) === 0) {org.re = RE_OK; return}
                org.energy     -= ((m2EndIdx - m2Idx + m1EndIdx - m1Idx + 2) * Config.energyMetabolismCoef);
                code[m1EndIdx] &= MASK8R;
                this.updateAtom(m1EndIdx, false);
                org.code        = code;
                org.re          = RE_OK;
                Compiler.compile(org, false);
                if (m2Idx > insIdx) {
                    Compiler.updateMetadata(org, m2Idx, m2EndIdx + 1, -1);
                    Compiler.updateMetadata(org, insIdx, insIdx + cutCode.length, 1);
                } else {
                    Compiler.updateMetadata(org, insIdx, insIdx + cutCode.length, 1);
                    Compiler.updateMetadata(org, m2Idx, m2EndIdx + 1, -1);
                }
                return;
            }

            case CATAB: {
                ++org.line;
                const code = org.code;
                //
                // Cuts molecules by index
                //
                if (org.ax < 0) {
                    let idx;
                    let bx = org.bx;
                    if (bx < 0) {bx = 0}
                    if (bx >= code.length) {bx = code.length - 1}
                    for (let i = bx - 1;; i--) {if ((code[i] & MASK8) > 0 || i < 0) {idx = i + 1; break}} // find first atom of molecule
                    if (code[bx] & MASK8) {org.re = RE_OK; return}
                    code[bx] |= MASK8;
                    this.updateAtom(bx, true);
                    const idxEnd = this._molLastOffs(code, bx);
                    org.energy += ((idxEnd - idx + 1) * Config.energyMetabolismCoef);
                    org.re = RE_OK;
                    return;
                }
                //
                // Cuts molecule by mol head and ax
                //
                const mol     = org.heads[org.head];
                const molEnd  = this._molLastOffs(code, mol);
                if (mol === molEnd) {org.re = RE_ERR; return}
                let   cutPos  = org.ax;
                const molSize = molEnd - mol + 1;
                if (mol + cutPos > molEnd) {cutPos = mol + Math.floor(molSize / 2) - 1}
                if (code[mol + cutPos] & MASK8) {org.re = RE_OK; return}
                code[mol + cutPos] |= MASK8;
                this.updateAtom(mol + cutPos, true);
                org.energy += (molSize * Config.energyMetabolismCoef);
                org.re = RE_OK;
                return;
            }

            case MMOL: {
                ++org.line;
                const heads    = org.heads;
                const head     = org.head;
                const nextHead = heads[head + 1 === heads.length ? 0 : head + 1];
                //
                // This code obtains source molecule
                //
                let    code    = org.code;
                let   m2Idx    = heads[head];
                if (m2Idx < 0) {m2Idx = 0}
                if (m2Idx >= code.length) {m2Idx = code.length - 1}
                for (let i = m2Idx - 1;; i--) {if ((code[i] & MASK8) > 0 || i < 0) {m2Idx = i + 1; break}} // find first atom of molecule
                if (m2Idx === nextHead) {org.re = RE_OK; return}    // src and dest molecules are the same
                const m2EndIdx = this._molLastOffs(code, m2Idx);
                const moveCode = code.slice(m2Idx, m2EndIdx + 1);
                if (moveCode.length < 1) {org.re = RE_ERR; return}
                //
                // This code obtains destination molecule
                //
                const len      = m2EndIdx - m2Idx + 1;
                code           = code.splice(m2Idx, len);
                const insIdx   = this._molLastOffs(code, nextHead + (m2Idx < (nextHead) ? -len : 0)) + 1;
                org.code       = code.splice(insIdx, 0, moveCode);
                org.energy    -= (moveCode.length * Config.energyMolMoveCoef);
                org.re         = RE_OK;
                Compiler.compile(org, false);
                //
                // further changed code should be called first
                //
                if (m2Idx > insIdx) {
                    Compiler.updateMetadata(org, m2Idx, m2EndIdx + 1, -1);
                    Compiler.updateMetadata(org, insIdx, insIdx + moveCode.length, 1);
                    Compiler.updateMetadata(org, insIdx, insIdx + moveCode.length, 1);
                } else {
                    Compiler.updateMetadata(org, insIdx, insIdx + moveCode.length, 1);
                    Compiler.updateMetadata(org, m2Idx, m2EndIdx + 1, -1);
                }
                return; 
            }

            case MOL: {
                ++org.line;
                org.ax    = org.heads[org.head];
                org.bx    = this._molLastOffs(org.code, org.ax);
                return;
            }

            case SMOL: {
                ++org.line;
                const code = org.code;
                if (org.ax < 0) {org.heads[org.head] = org.ax = 0; return}
                if (org.ax >= code.length) {org.ax = code.length - 1}
                for (let i = org.ax - 1;; i--) {
                    if ((code[i] & MASK8) > 0 || i < 0) {
                        org.heads[org.head] = i + 1;
                        break;
                    }
                }
                return;
            }

            // TODO: what about case with zero length code?
            case RMOL: {
                ++org.line;
                if (org.code.length < 2) {org.re = RE_OK; return}
                if ((org.heads[org.head] = this._molLastOffs(org.code, org.heads[org.head]) + 1) >= org.code.length) {
                    org.heads[org.head] = 0;
                    org.re = RE_SPECIAL;
                } else {
                    org.re = RE_OK;
                }
                return;
            }

            // TODO: what about case with zero length code?
            case LMOL: {
                ++org.line;
                const code = org.code;
                if (code.length < 2) {org.re = RE_OK; return}
                let   mol  = org.heads[org.head];
                let   ret  = RE_OK;

                for (let i = mol - 1;; i--) {
                    if (i < 0) {mol = 0; break}
                    if ((code[i] & MASK8) > 0) {mol = i + 1; break}
                }
                if (--mol < 0) {mol = code.length - 1; org.re = RE_SPECIAL}
                if (mol === 0) {org.heads[org.head] = 0; org.re = RE_OK; return}
                for (let i = mol - 1, loop = 0;; i--) {
                    if (i < 0) {
                        ret = RE_SPECIAL;
                        i = code.length - 1;
                        if (++loop > 1) {org.heads[org.head] = 0; org.re  = RE_OK; return}
                        continue;
                    }
                    if ((code[i] & MASK8) > 0) {mol = i + 1; break}
                }
                org.heads[org.head] = mol;
                org.re  = ret;
                return;
            }

            case CMOL: {
                ++org.line;
                const code = org.code;
                const len  = code.length;
                const mem  = org.mem;
                for (let i = org.heads[org.head], m = org.mPos; i < len; i++, m++) {
                    if (m >= ORG_MAX_MEM_SIZE) {m = 0}
                    mem[m] = code[i];
                    if ((code[i] & MASK8) > 0) {break}
                }
                return;
            }

            case MCMP: {
                ++org.line;
                const code = org.code;
                const idx0 = org.heads[org.head];
                const idx1 = this._molLastOffs(code, idx0);

                if (org.ax < 1) {  // compares memory and current mol head
                    const mem  = org.mem;

                    for (let i = idx0, m = org.mPos; i <= idx1; i++, m++) {
                        if (m >= ORG_MAX_MEM_SIZE) {m = 0}
                        if (mem[m] !== code[i]) {org.re = RE_ERR; return}
                    }
                } else {           // compares current and next mol heads
                    let idx2 = org.heads[org.head + 1 === org.heads.length ? 0 : org.head + 1];
    
                    for (let i = idx0; i <= idx1; i++, idx2++) {
                        if (code[idx2] !== code[i]) {org.re = RE_ERR; return}
                    }
                }
                org.re = RE_OK;
                return;
            }

            /**
             * In:
             *   h0 - mol
             *   h1 - search start idx
             *   h2 - search end idx
             *   ax - insertion idx
             * Out:
             *   re - RE_OK|RE_ERR
             */
            case ASM: {
                ++org.line;
                const heads  = org.heads.length;
                const head   = org.head;
                const code   = org.code;
                const idx0   = org.heads[head + 1 === heads ? 0 : head + 1];
                const idx1   = org.heads[head + 2 >=  heads ? head + 2 - heads : head + 2];
                const mol    = org.heads[org.head];
                const molLen = this._molLastOffs(code, mol) - mol + 1;
                const ax     = this._molLastOffs(code, org.ax) + 1;
                //
                // We search needed atoms without checking of separator atoms
                //
                loop: for (let i = Math.max(0, idx0), till = Math.min(code.length - 1, idx1); i <= till; i++) {
                    for (let j = 0; j < molLen; j++) {
                        if ((code[i + j] & MASK8R) !== (code[j + mol] & MASK8R)) {continue loop}
                    }
                    //
                    // Index of needed atoms in "i". Search for right mol len
                    //
                    const idx01 = i + molLen - 1;
                    let len;
                    for (let j = idx01;; j--) {
                        if (j < 0) {len = idx01 + 1; break}
                        if ((code[j] & MASK8) > 0) {len = idx01 - j + 1; break}
                    }
                    len += this._molLastOffs(code, idx01) - idx01;
                    code[idx01] |= MASK8;
                    //
                    // Search for left mol len
                    //
                    for (let j = i - 1;; j--) {
                        if (j < 0) {len += i; break}
                        if ((code[j] & MASK8) > 0) {len += (idx01 - i); break}
                    }
                    len += this._molLastOffs(code, i - 1) - i - 1;
                    i > 0 && (code[i - 1] |= MASK8);
                    //
                    // Cuts found atoms
                    //
                    const atoms = code.slice(i, i + molLen);
                    org.code    = code.splice(i, i + molLen);
                    org.code    = org.code.splice(ax < i ? ax : ax - molLen, 0, atoms);
                    //
                    // join atoms together to needed molecule
                    //
                    if (molLen > 1) {
                        for (let j = 1, prev = 0; j < molLen; j++) {
                        for (let j = 1, prev = 0; j < molLen; j++) {
                            if ((atoms[j] & MASK8) > 0) {
                                len -= (j = prev);
                                prev = j;
                            }
                        }
                    }
                    //
                    // Calc energy
                    //
                    org.energy += (len * Config.energyMetabolismCoef);
                    org.re = RE_OK;
                    return;
                }
                org.re = RE_ERR;
                return;
            }

            case REAX:
                ++org.line;
                org.ax = org.re;
                return;

            case DIR:
                ++org.line;
                org.dir = DIRS[Math.abs(org.ax) % 8];
                return;

            case LHEAD:
                ++org.line;
                if (--org.head < 0) {org.head = org.heads.length - 1}
                return;

            case RHEAD:
                ++org.line;
                if (++org.head === org.heads.length) {org.head = 0}
                // eslint-disable-next-line no-useless-return
                return;
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
     * If parent parameter !== null, then copies additional properties from
     * parent like memory, mutation rate and so on
     * @param {Organism} parent Parent organism we are cloning from
     * @param {Number} offset Offset in a world
     * @param {Uint8Array} code Code to set
     * @param {Number} energy Amount of organism energy to start with
     * @override
     */
    addOrg (parent, offset, code, energy) {
        const orgsMols = this.orgsMols;
        const org    = super.addOrg(this.orgs.freeIndex, code);
        //
        // Extends organism properties
        //
        org.offset   = offset;              // Absolute position of organism in a world
        org.molIndex = orgsMols.freeIndex;  // Index of organism in orgsMols array
        org.packet   = null;                // Special place for storing atom, molecule or other organism
        org.energy   = energy;              // Orgainm's energy
        org.heads    = new Uint16Array(4);  // Organism's custom heads
        org.head     = 0;                   // Pointer to current head
        org.dir      = 1;                   // Active direction offset
        org.re       = 0;                   // Register "re". Is used as result for command (mmol, step, see,...)
        if (parent) {
            org.probs   = parent.probs.slice();
            org.period  = parent.period;
            org.percent = parent.percent;
            org.color   = parent.color;     // Current organism color
        } else {
            org.color   = Config.orgColor;  // Current organism color
        }
        Compiler.compile(org);

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
            packet.hasOwnProperty('energy') ? this.addOrg(null, offset, packet.code, packet.energy) : this.addMol(offset, packet.code);
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
        this.world.mol(offset, mol, this.molColor(mol.code));

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
        const lucas = Config.LUCAS;
        let orgs    = lucas.length;
        while (orgs-- > 0) {
            const luca   = lucas[orgs];
            const sCode  = luca.code;
            const bCode  = luca.bCode ? luca.bCode : luca.bCode = Compiler.toByteCode(sCode);
            const offset = luca.offs || rand(MAX_OFFS);
            const energy = luca.energy ? luca.energy : Config.energyOrg;
            if (world.index(offset) > -1) {orgs++; continue}
            this.addOrg(null, offset, bCode.slice(), energy);
            // const luca = this.addOrg(offset, code.slice(), energy);
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
     * Returns color of molecule by it's atoms
     * @param {Uint8Array} code Code
     * @return {Number} color Color in 0xRRGGBB format
     */
    molColor(code) {
        const len   = code.length;
        const bits  = len > 3 ? Math.floor(21 / len) || Config.molColor : 8;
        const left  = 8 - bits;
        let   cBits = 0;
        let   color = 0;

        for (let i = 0; i < len; i++) {
            color |= ((((code[i] & MASK8R) << left) >>> left) << cBits);
            cBits += bits;
        }

        return color;
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
     * Generates random code and code based on organism parts
     * @returns {Uint8Array}
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
            code[size - 1] |= MASK8;
            return code;
        }
        const luca  = Config.LUCAS[0];
        const bCode = luca.bCode ? luca.bCode : luca.bCode = Compiler.toByteCode(luca.code);
        const len   = bCode.length;
        let   start = Math.floor(Math.random() * len);
        //
        // Sets start to the first atom in a molecule
        //
        for (let i = start - 1;; i--) {if ((bCode[i] & MASK8) > 0 || i < 0) {start = i + 1; break}}
        return bCode.slice(start, this._molLastOffs(bCode, start) + 1);
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
            if ((code[i] & MASK8)) {
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
     * @return {Number} Index of last atom
     */
    _molLastOffs(code, index) {
        const len = code.length;
        // eslint-disable-next-line no-empty
        while ((code[index] & MASK8) === 0 && index < len) {index++}
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
            if (world.index(offset + DIRS[i++]) === -1) {
                return offset + DIRS[i++];
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
                canvas.dot(yOffs + x, org === -1 ? 0x000000 : orgMol[org].color || this.molColor(orgMol[org].code));
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