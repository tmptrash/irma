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
        if (Config.LUCAS.length + 1 + BioVM._orgsMolsAmount() > WIDTH * HEIGHT - 1) {
            // eslint-disable-next-line no-console
            console.error('Amount of molecules and organisms is greater then amount of dots in a world. Decrease "molAmount" and "LUCAS.length" configs');
            return;
        }
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
    afterIteration(org) {
        if (org.energy < 0 || (Config.orgMaxAge > 0 && org.age > Config.orgMaxAge)) {
            this.delOrg(org);
            this.addMol(org.offset, org.code);
        }
        org.energy -= Config.energyCommand;
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
            /**
             * In:
             *   dir - join direction
             *   h0  - insertion index (after this mol)
             * Out:
             *   re  - joined-atoms-amount|RE_ERR|RE_SPECIAL
             */
            case JOIN: {
                ++org.line;
                const offset  = this._getOffset(org);
                const dot     = this.world.index(offset);
                if (dot < 0) {org.re = RE_ERR; return}
                const nearOrg = this.orgsMols.get(dot);
                if (nearOrg.packet) {org.re = RE_ERR; return}
                const nearLen = nearOrg.code.length;
                const code    = org.code;
                if (nearLen + code.length > ORG_CODE_MAX_SIZE) {org.re = RE_SPECIAL; return}
                const idx     = this._lastAtomIdx(code, org.heads[org.head]) + 1;
                org.code      = code.insert(idx, nearOrg.code);
                nearOrg.energy > 0 ? this.delOrg(nearOrg) : this.delMol(nearOrg);
                org.re        = nearLen;
                Compiler.compile(org, false);                 // Safe recompilation without loosing metadata
                Compiler.updateMetadata(org, idx, idx + nearLen, 1);
                return;
            }
            //
            // TODO: This is bad idea to hardcode IS_ORG_ID into language. Because this mechanism
            // TODO: should be supported by organism from parent to child
            //
            /**
             * In:
             *   [m0] - IS_ORG_ID - unique identifier of organism (difference between org and mol)
             *   dir  - split direction
             *   h0   - start split idx
             *   h1   - end split idx (after this mol)
             * Out:
             *   re   - RE_OK|RE_ERR
             */
            case SPLIT: {
                ++org.line;
                org.re        = RE_OK;
                // TODO: these checks may be removed if we don't change amount of atoms in a world
                if (this.orgsMols.full || org.mem[org.mPos] === IS_ORG_ID && this.orgs.full) {org.re = RE_ERR; return} // mols and orgs maximum was reached
                const offset  = this._getOffset(org);
                const dot     = this.world.index(offset);
                if (dot > -1) {org.re = RE_ERR; return} // something on the way
                const code    = org.code;
                let   idx0    = this._firstAtomIdx(code, org.heads[org.head]);
                let   idx1    = this._firstAtomIdx(code, org.heads[org.head + 1 === org.heads.length ? 0 : org.head + 1]);
                if (idx0 > idx1) {const tmp = idx0; idx0 = idx1; idx1 = tmp}
                idx1 = this._lastAtomIdx(code, idx1) + 1;
                if (idx1 === idx0) {org.re = RE_ERR; return}
                const newCode = code.subarray(idx0, idx1);
                org.code      = code.remove(idx0, idx1 - idx0);
                const clone   = org.mem[org.mPos] === IS_ORG_ID ? this.addOrg(org, offset, newCode, org.energy /= 2) : this.addMol(offset, newCode);
                // this.db && this.db.put(clone, org);
                if (Config.codeMutateEveryClone > 0 && rand(Config.codeMutateEveryClone) === 0 && clone.energy) {Mutations.mutate(this, clone)}
                if (org.code.length < 1) {this.delOrg(org); return}
                Compiler.compile(org, false);               // Safe recompilation without loosing metadata
                Compiler.updateMetadata(org, idx0, idx1, -1);
                return;
            }
            /**
             * In:
             *   dir - step direction
             * Out:
             *   re  - RE_OK|RE_ERR|RE_SPECIAL
             */
            case STEP: {
                ++org.line;
                org.re = RE_OK;
                const offset = this._getOffset(org);
                if (this.world.index(offset) > -1) {org.re = RE_ERR; return}
                org.energy -= (org.code.length * Config.energyStepCoef + (org.packet ? org.packet.code.length * Config.energyStepCoef : 0));
                this.world.moveOrg(org, offset);
                return;
            }
            /**
             * In:
             *   ax - offset to see
             * Out:
             *   ax - 0|org-color|mol-color
             */
            case SEE: {
                ++org.line;
                const offset = org.offset + org.ax;
                if (offset < 0 || offset > MAX_OFFS) {org.ax = 0; return}
                const dot = this.world.index(offset);
                const mol = this.orgsMols.get(dot);
                org.ax = (dot < 0 ? 0 : mol.color || this.molColor(mol.code));
                return;
            }
            /**
             * In:
             *   ax - value to say
             *   bx - frequency of saying
             */
            case SAY: {
                ++org.line;
                const freq = Math.abs(org.bx) % Config.worldFrequency;
                this.freq[freq] = org.ax;
                return;
            }
            /**
             * In:
             *   bx - frequency to listen
             * Out:
             *   ax - listened value
             */
            case LISTEN:
                ++org.line;
                org.ax = this.freq[Math.abs(org.bx) % Config.worldFrequency];
                return;
            /**
             * In:
             *   ax  - Idx in near org or mol
             *   dir - near org or mol direction
             * Out:
             *   ax  - read command
             *   re  - RE_OK|RE_ERR|RE_SPECIAL
             */
            case NREAD: {
                ++org.line;
                org.re         = RE_OK;
                const offset   = this._getOffset(org);
                const dot      = this.world.index(offset);
                if (dot < 0) {org.re = RE_ERR; return}
                const nearOrg  = this.orgsMols.get(dot);
                const nearCode = nearOrg.code;
                let   ax       = org.ax;
                if (ax < 0) {ax = 0}
                if (ax >= nearCode.length) {ax = nearCode.length - 1}
                org.ax         = nearCode[ax];
                return;
            }
            /**
             * In:
             *   dir - direction, where to get org|mol
             * Out:
             *   re  - RE_OK|RE_ERR|RE_SPECIAL
             */
            case GET: {
                ++org.line;
                org.re = RE_OK;
                if (org.packet) {org.re = RE_ERR; return}
                const offset = this._getOffset(org);
                const dot = this.world.index(offset);
                if (dot < 0) {org.re = RE_ERR; return}
                (org.packet = this.orgsMols.get(dot)).hasOwnProperty('energy') ? this.delOrg(org.packet) : this.delMol(org.packet);
                return;
            }
            /**
             * In:
             *   dir - put direction
             * Out:
             *   re  - RE_OK|RE_ERR|RE_SPECIAL
             */
            case PUT: {
                ++org.line;
                org.re = RE_OK;
                if (!org.packet) {org.re = RE_ERR; return}
                if (this.orgsMols.full) {org.re = RE_ERR; return}
                const offset = this._getOffset(org);
                const dot = this.world.index(offset);
                if (dot > -1) {org.re = RE_ERR; return}
                org.packet.hasOwnProperty('energy') ? this.addOrg(org.packet, offset, org.packet.code, org.packet.energy) : this.addMol(offset, org.packet.code);
                // this.db && this.db.put(org.packet);
                org.packet = null;
                return;
            }
            /**
             * Out:
             *   ax - current offset
             */
            case OFFS:
                ++org.line;
                org.ax = org.offset;
                return;
            /**
             * In:
             *   ax    - new color
             * Out:
             *   color - new color|ORG_MIN_COLOR
             */
            case COLOR: {
                ++org.line;
                const newAx = Math.abs(org.ax);
                org.color   = (newAx < ORG_MIN_COLOR ? ORG_MIN_COLOR : newAx) % 0xffffff;
                return;
            }
            /**
             *   In:
             *     ax - < 0 - joining nearest mols
             *     h0 - first mol to join
             *   Out:
             *     re - RE_OK|RE_ERR|RE_SPECIAL
             * 
             *   In:
             *     ax - > 0 - joining far located mols
             *     h0 - first mol to join
             *     h1 - second mol to join
             *   Out:
             *     re - RE_OK|RE_ERR
             */
            case ANAB: {
                ++org.line;
                let code    = org.code;
                const m1Idx = this._firstAtomIdx(code, org.heads[org.head]);
                //
                // Join current and next molecules into one
                //
                if (org.ax < 0) {
                    const m1EndIdx  = this._lastAtomIdx(code, m1Idx);
                    const m2Idx     = m1EndIdx + 1;
                    let   m2EndIdx  = this._lastAtomIdx(code, m2Idx);
                    if (m2EndIdx >= code.length) {m2EndIdx = code.length - 1}
                    if (m1EndIdx === m2EndIdx) {org.re = RE_OK; return}
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
                const m2Idx     = this._firstAtomIdx(code, org.heads[org.head + 1 === org.heads.length ? 0 : org.head + 1]);
                if (m1Idx === m2Idx) {org.re = RE_ERR; return}
                let   anabIdx;
                const m1EndIdx  = this._lastAtomIdx(code, m1Idx);
                const m2EndIdx  = this._lastAtomIdx(code, m2Idx);
                const cutCode   = code.subarray(m2Idx, m2EndIdx + 1);
                const insIdx    = m1EndIdx + 1;
                if (m1Idx > m2Idx) {
                    code    = code.insert(insIdx, cutCode);
                    code    = code.remove(m2Idx, m2EndIdx - m2Idx + 1);
                    anabIdx = m1EndIdx - (m2EndIdx - m2Idx + 1);
                } else {
                    code    = code.remove(m2Idx, m2EndIdx - m2Idx + 1);
                    code    = code.insert(insIdx, cutCode);
                    anabIdx = m1EndIdx;
                }
                if ((code[anabIdx] & MASK8) === 0) {org.re = RE_OK; return}
                org.energy     -= ((m2EndIdx - m2Idx + m1EndIdx - m1Idx + 2) * Config.energyMetabolismCoef);
                code[anabIdx] &= MASK8R;
                this.updateAtom(anabIdx, false);
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
            /**
             * In:
             *   ax - < 0 - cut mol by idx
             *   bx - idx to cut
             * Out:
             *   re - RE_OK|RE_ERR
             * 
             * In:
             *   ax - >= 0 - cut idx inside cur mol
             *   h0 - mol idx
             * Out:
             *   re - RE_OK|RE_ERR
             */
            case CATAB: {
                ++org.line;
                const code = org.code;
                //
                // Cuts molecules by index
                //
                if (org.ax < 0) {
                    const bx  = this._fixIndex(code, org.bx);
                    const idx = this._firstAtomIdx(org.code, bx);
                    if (code[bx] & MASK8) {org.re = RE_OK; return}
                    const idxEnd = this._lastAtomIdx(code, bx);
                    code[bx] |= MASK8;
                    this.updateAtom(bx, true);
                    org.energy += ((idxEnd - idx + 1) * Config.energyMetabolismCoef);
                    org.re = RE_OK;
                    return;
                }
                //
                // Cuts molecule by mol head and ax
                //
                const mol     = this._firstAtomIdx(code, org.heads[org.head]);
                const molEnd  = this._lastAtomIdx(code, mol);
                if (mol === molEnd) {org.re = RE_ERR; return}
                let   cutPos  = org.ax;
                const molSize = molEnd - mol + 1;
                if (mol + cutPos > molEnd) {cutPos = 0}
                if (code[mol + cutPos] & MASK8) {org.re = RE_OK; return}
                code[mol + cutPos] |= MASK8;
                this.updateAtom(mol + cutPos, true);
                org.energy += (molSize * Config.energyMetabolismCoef);
                org.re = RE_OK;
                return;
            }
            /**
             * In:
             *   h0 - dst mol idx (after mol)
             *   h1 - src mol idx
             * Out:
             *   re - RE_OK|RE_ERR
             */
            case MMOL: {
                ++org.line;
                const code      = org.code;
                const m2Idx     = this._firstAtomIdx(code, org.heads[org.head + 1 === org.heads.length ? 0 : org.head + 1]);
                const m1EndIdx  = this._lastAtomIdx(code, org.heads[org.head]);
                const m2EndIdx  = this._lastAtomIdx(code, m2Idx);
                if (m1EndIdx === m2EndIdx) {org.re = RE_ERR; return}
                const insIdx    = m1EndIdx + 1;
                code.move(m2Idx, m2EndIdx + 1, insIdx);
                org.code        = code;
                org.re          = RE_OK;
                Compiler.compile(org, false);
                Compiler.updateMetadataOnMove(org, m2Idx, m2EndIdx + 1, insIdx);
                return;
            }
            /**
             * Out:
             *   ax - first atom in a mol
             *   bx - last atom in a mol
             */
            case MOL: {
                ++org.line;
                const code = org.code;
                org.ax     = this._firstAtomIdx(code, org.heads[org.head]);
                org.bx     = this._lastAtomIdx(org.code, org.ax);
                return;
            }
            /**
             * In:
             *   ax - new idx to set
             * Out:
             *   h0 - new idx
             *   ax - fixed idx of first atom
             */
            case SMOL: {
                ++org.line;
                const code = org.code;
                let ax = org.ax;
                if (ax < 0) {org.heads[org.head] = org.ax = 0; return}
                if (ax >= code.length) {ax = code.length - 1}
                for (let i = ax - 1;; i--) {
                    if ((code[i] & MASK8) > 0 || i < 0) {
                        org.heads[org.head] = ax = i + 1;
                        break;
                    }
                }
                org.ax = ax;
                return;
            }
            /**
             * Out:
             *   h0 - new idx
             *   re - RE_OK|RE_ERR|RE_SPECIAL
             */
            case RMOL: {
                ++org.line;
                const code  = org.code;
                const heads = org.heads;
                if (code.length < 2) {org.re = RE_OK; return}
                if ((heads[org.head] = this._lastAtomIdx(code, heads[org.head]) + 1) >= code.length) {
                    heads[org.head] = 0;
                    org.re = RE_SPECIAL;
                } else {
                    org.re = RE_OK;
                }
                return;
            }
            /**
             * Out:
             *   h0 - new idx
             *   re - RE_OK|RE_ERR|SPECIAL
             */
            case LMOL: {
                ++org.line;
                const code = org.code;
                if (code.length < 2) {org.re = RE_OK; return}
                let re  = RE_OK;
                let idx = this._firstAtomIdx(code, org.heads[org.head]);
                if (idx <= 0 || --idx <= 0) {idx = code.length - 1; re = RE_SPECIAL}
                org.heads[org.head] = this._firstAtomIdx(code, idx);
                org.re = re;
                return;
            }
            /**
             * In:
             *   h0 - copy mol idx
             * Out:
             *   m0 - copied mol
             */
            case CMOL: {
                ++org.line;
                const code = org.code;
                const len  = code.length;
                const mem  = org.mem;
                const idx  = this._firstAtomIdx(code, org.heads[org.head]);
                for (let i = idx, m = org.mPos; i < len; i++, m++) {
                    if (m >= ORG_MAX_MEM_SIZE) {m = 0}
                    mem[m] = code[i];
                    if ((code[i] & MASK8) > 0) {break}
                }
                return;
            }
            /**
             * In:
             *   ax - < 1 compares m0 and h0
             *   m0 - mol in m0 to compare
             *   h0 - idx of mol to compare
             * Out:
             *   re - RE_OK|RE_ERR 
             * 
             * In:
             *   ax - > 0 compares h0 and h1
             *   h0 - idx of mol0 to compare
             *   h1 - idx of mol1 to compare
             * Out:
             *   re - RE_OK|RE_ERR 
             */
            case MCMP: {
                ++org.line;
                const code = org.code;
                const idx0 = this._firstAtomIdx(code, org.heads[org.head]);
                const idx1 = this._lastAtomIdx(code, idx0);

                if (org.ax < 1) {  // compares memory and current mol head
                    const mem  = org.mem;
                    for (let i = idx0, m = org.mPos; i <= idx1; i++, m++) {
                        if (m >= ORG_MAX_MEM_SIZE) {m = 0}
                        if (mem[m] !== code[i]) {org.re = RE_ERR; return}
                    }
                } else {           // compares current and next mol heads
                    let idx2 = this._firstAtomIdx(code, org.heads[org.head + 1 === org.heads.length ? 0 : org.head + 1]);
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
                const heads   = org.heads;
                const headLen = heads.length;
                const head    = org.head;
                let   code    = org.code;
                const idx0    = this._firstAtomIdx(code, heads[head + 1 === headLen ? 0 : head + 1]);
                let idx1      = this._lastAtomIdx(code, heads[head + 2 >= headLen ? head + 2 - headLen : head + 2]) + 1;
                let mol       = this._firstAtomIdx(code, heads[head]);
                const mol0    = mol;
                let molLen    = this._lastAtomIdx(code, heads[head]) - mol + 1;
                const molLen0 = molLen;
                let ax        = this._fixIndex(code, org.ax);
                if (ax > idx0 && ax < idx1 || mol >= idx0 && mol < idx1) {org.re = RE_ERR; return}
                const ax0 = ax = this._lastAtomIdx(code, ax) + 1;
                //
                // Imagine we search for [1,2,3,4] in [0,3,1,2,4,5]. Search will work in this way:
                //   1. Try to find [1,2,3,4] -> false [0,3,1,2,4,5]
                //   2. Try to find [1,2,3]   -> false [0,3,1,2,4,5]
                //   3. Try to find [1,2]     -> true  [0,3,4,5]
                //   4. Try to find [3,4]     -> false [0,3,4,5]
                //   5. Try to find [3]       -> true  [0,4,5]
                //   6. Try to find [4]       -> true  [0,5]
                //
                const molEnd = mol + molLen;
                while (mol < molEnd && molLen > 0) {
                    const axp   = ax;
                    const idx1p = idx1;
                    const molp  = mol;
                    if (!this._asmAtoms(org, mol, idx0, idx1, ax, molLen)) {molLen--; continue}
                    //
                    // Update indexes after move
                    //
                    if (molp > axp && molp < idx0)        {mol  += molLen}
                    else if (molp > idx1p && molp < axp)  {mol  -= molLen}
                    if (axp > idx1p)                      {ax   -= molLen}
                    if (idx1p < axp)                      {idx1 -= molLen}

                    mol   += molLen;
                    ax    += molLen;
                    molLen = molEnd - mol;
                }
                //
                // All atoms of needed mol were copied
                //
                if (mol >= molEnd) {
                    //
                    // join atoms together to needed molecule
                    //
                    code     = org.code;
                    let len  = 0;
                    const j0 = ax > idx1 ? ax - molLen0 : ax0;
                    for (let j = j0, l = j + molLen0 - 1; j < l; j++) {
                        if ((code[j] & MASK8) > 0) {
                            code[j] &= MASK8R;
                            this.updateAtom(j, false);
                            len += (j - j0 + 1);
                        }
                    }
                    //
                    // Calc energy
                    //
                    org.energy -= (len * Config.energyMetabolismCoef);
                    Compiler.compile(org, false);
                    org.re = RE_OK;
                    return;
                }
                //
                // Not all atoms were copied. Moves found atoms back and do recompilation
                //
                org.re   = RE_ERR;
                molLen   = mol - mol0;
                if (molLen < 1) {return}
                org.code.move(ax0, ax0 + molLen, idx0);
                Compiler.compile(org, false);
                Compiler.updateMetadataOnMove(org, ax0, ax0 + molLen, idx0);
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
        org.energy   = energy;              // Organism's energy
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
            const offset = (luca.offs && world.index(luca.offs) === -1 && luca.offs < MAX_OFFS && luca.offs > 0) ? luca.offs : rand(MAX_OFFS);
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

    _getOffset(org) {
        let offset = org.offset + org.dir;
        if (offset < 0) {org.re = RE_SPECIAL; offset = LINE_OFFS + org.offset}
        else if (offset > MAX_OFFS) {org.re = RE_SPECIAL; offset = org.offset - LINE_OFFS}
        return offset;
    }

    /**
     * Searches for specified molecule in a code ignoring separator atoms.
     * Does anabolism and catabolism if needed. So, generally it's metabolism
     * implementation
     * @param {Organism} org
     * @param {Number} molIdx Index of molecule to find
     * @param {Number} idx0 Start search index
     * @param {Number} idx1 End search index
     * @param {Number} ax insertion index
     * @param {Number} molLen Length of molecule to find
     * @return {Boolean} Atoms were found and moved
     */
    _asmAtoms(org, molIdx, idx0, idx1, ax, molLen) {
        const code = org.code;
        //
        // We search needed atoms without checking of separator atoms
        //
        loop: for (let i = Math.max(0, idx0), till = Math.min(code.length - 1, idx1); i <= till; i++) {
            for (let j = 0; j < molLen; j++) {
                if ((code[i + j] & MASK8R) !== (code[j + molIdx] & MASK8R)) {continue loop}
            }
            //
            // Index of needed atoms in "i". Cuts found atoms from left and right
            //
            let len = 0;
            if (i > 0 && (code[i - 1] & MASK8) === 0) {
                code[i - 1] |= MASK8;
                this.updateAtom(i - 1, true);
                len += (molLen / 2);
            }
            const idx01 = i + molLen - 1;
            if ((code[idx01] & MASK8) === 0) {
                code[idx01] |= MASK8;
                this.updateAtom(idx01, true);
                len += (molLen / 2);
            }
            //
            // We calculate average energy adding, because we do catabolism.
            // Calculation of real energy amount is very complicated process.
            //
            org.energy += (len * Config.energyMetabolismCoef);
            //
            // Moves found atoms and do recompilation
            //
            code.move(i, i + molLen, ax);
            Compiler.updateMetadataOnMove(org, i, i + molLen, ax);

            return true;
        }

        return false;
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
        return bCode.slice(start, this._lastAtomIdx(bCode, start) + 1);
    }

    /**
     * Fixed index, if it's out of range. Index should be in 0...code.length-1
     * @param {Uint8Array} code 
     * @param {Number} idx Index we have to fix
     */
    _fixIndex(code, idx) {
        if (idx < 0) {idx = 0}
        else if (idx > code.length) {idx = code.length - 1}
        return idx;
    }

    /**
     * Returns first atom in a molecule starting from idx
     * @param {Uint8Array} code Code, where to search
     * @param {Number} idx Start idx
     * @return {Number} index of first atom in a mol or -1
     */
    _firstAtomIdx(code, idx) {
        idx = this._fixIndex(code, idx);
        for (let i = idx - 1;; i--) {
            if ((code[i] & MASK8) > 0 || i < 0) {return i + 1}
        }
    }

    /**
     * Returns index of last atom in molecule in a code starting from idx
     * @param {Uint8Array} code Code we a looking in
     * @param {Number} idx Index of first atom in molecule
     * @return {Number} Index of last atom
     */
    _lastAtomIdx(code, idx) {
        const len = code.length;
        idx = this._fixIndex(code, idx);
        // eslint-disable-next-line no-empty
        while ((code[idx] & MASK8) === 0 && idx < len) {idx++}
        return idx;
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