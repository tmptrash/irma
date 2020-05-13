/**
 * Mutations class. The purpose of this class is to change organisms code a little and randomly.
 * Code change breaks original organism in most cases, but sometimes it brings new effective
 * mutations (features).
 * 
 * @author flatline
 */
const Config   = require('./../Config');
const Helper   = require('./../common/Helper');
const Compiler = require('./Compiler');
const Molecule = require('./Molecule');

const rand                  = Helper.rand;
/**
 * {Number} Amount of mutation probabilities values.
 */
const ORG_PROBS             = Config.orgProbs.length;
/**
 * {Number} Maximum probability value for array of probabilities
 */
const ORG_PROB_MAX_VALUE    = Config.ORG_PROB_MAX_VALUE;
/**
 * {Number} This offset will be added to commands value. This is how we
 * add an ability to use numbers in a code, just putting them as command
 */
const CODE_CMD_OFFS         = Config.CODE_CMD_OFFS;
/**
 * {Number} Amount of supported commands in a code
 */
const CODE_COMMANDS         = Config.CODE_COMMANDS;
/**
 * {Number} Maximum stack size, which may be used for recursion or function parameters
 */
// const CODE_MAX_STACK_SIZE   = 30000;
/**
 * {Number} Default amount of mutations
 */
const CODE_MUTATION_AMOUNT  = .02;
/**
 * Max code size
 */
const ORG_CODE_MAX_SIZE     = Config.ORG_MAX_CODE_SIZE;
/**
 * {Number} Last atom in molecule bit mask
 */
const CODE_8_BIT_MASK       = Config.CODE_8_BIT_MASK;
const WIDTH                 = Config.WORLD_WIDTH - 1;
const HEIGHT                = Config.WORLD_HEIGHT - 1;
const WIDTH1                = WIDTH + 1;
const HEIGHT1               = HEIGHT + 1;
const LINE_OFFS             = HEIGHT * WIDTH1;
const MAX_OFFS              = WIDTH1 * HEIGHT1 - 1;     // We need -1 to prevent using offset >= MAX_OFFS ... instead offset > MAX_OFFS
/**
 * {Number} nop command index
 */
// const NOP                  = Config.CODE_CMDS.NOP;
// const NOP_MOL              = NOP | CODE_8_BIT_MASK;

class Mutations {
    /**
     * Apply mutations to specified organism
     * @param {VM} vm
     * @param {Organism} org
     */
    static mutate(vm, org) {
        const mutCbs    = Mutations._MUTATION_CBS;
        const mutations = ((org.code.length * org.percent) << 0) || 1;
        const prob      = Helper.probIndex;
        for (let m = 0; m < mutations; m++) {mutCbs[prob(org.probs)](vm, org.code, org)}
    }

    static randCmd() {return rand(CODE_COMMANDS) === 0 ? rand(CODE_CMD_OFFS) : rand(CODE_COMMANDS) + CODE_CMD_OFFS}
    
    /**
     * Takes random atom from random molecule in a world and switch it by random one
     * from organism. Keeps @mol separator during switch.
     */
    static _onChange(vm, code, org) {
        const oMols     = vm.orgsMols;
        const items     = oMols.items;
        let srcMol;
        if (!((srcMol   = oMols.get(rand(items))) instanceof Molecule || (srcMol = oMols.get(rand(items))) instanceof Molecule || (srcMol = oMols.get(rand(items))) instanceof Molecule)) {return}
        if (srcMol.code.length < 1) {return}
        const srcCode   = srcMol.code;
        const dstIdx    = rand(code.length);
        const srcIdx    = rand(srcCode.length);
        const srcCmd    = srcCode[srcIdx];
        const dstCmd    = code[dstIdx];
        srcCode[srcIdx] = (srcCmd & CODE_8_BIT_MASK) ? dstCmd | CODE_8_BIT_MASK : dstCmd;
        code[dstIdx]    = (dstCmd & CODE_8_BIT_MASK) ? srcCmd | CODE_8_BIT_MASK : srcCmd;
        Compiler.compile(org, false);                     // Safe recompilation without loosing metadata
        Compiler.updateMetadata(org, dstIdx, dstIdx, 1);
    }

    /**
     * Takes random atom from organism code and remove it by putting near
     */
    static _onDel(vm, code, org) {
        if (vm.orgsMols.full) {return}
        let offset      = org.offset + org.dir;
        if (offset < 0) {offset = LINE_OFFS + org.offset}
        else if (offset > MAX_OFFS) {offset = org.offset - LINE_OFFS}
        const dot       = vm.world.index(offset);
        if (dot > -1) {return} // something on the way
        let idx         = rand(code.length);
        const dstCmd    = code[idx];
        const isMol     = (dstCmd & CODE_8_BIT_MASK) > 0;
        org.code        = code.remove(idx, 1);
        if (isMol) {if (idx >= org.code.length) {idx--} org.code[idx] |= CODE_8_BIT_MASK}
        vm.addMol(offset, new Uint8Array([dstCmd | CODE_8_BIT_MASK])); // one atom always final
        if (org.code.length < 1) {vm.delOrg(org); return}
        Compiler.compile(org, false);                     // Safe recompilation without loosing metadata
        Compiler.updateMetadata(org, idx, idx + 1, -1);
    }

    /**
     * Takes random atom from random molecule in a world and inserts it into ransom 
     * code position
     */
    static _onAdd(vm, code, org) {
        if (code.length > ORG_CODE_MAX_SIZE) {return}
        const oMols     = vm.orgsMols;
        const items     = oMols.items;
        let srcMol;
        if (!((srcMol   = oMols.get(rand(items))) instanceof Molecule || (srcMol = oMols.get(rand(items))) instanceof Molecule || (srcMol = oMols.get(rand(items))) instanceof Molecule)) {return}
        if (srcMol.code.length < 2) {return}
        const srcCode   = srcMol.code;
        const dstIdx    = rand(code.length);
        let srcIdx      = rand(srcCode.length);
        const srcCmd    = srcCode[srcIdx];
        const isMol     = (srcCmd & CODE_8_BIT_MASK) > 0;
        org.code        = code.splice(dstIdx, 0, new Uint8Array([srcCmd]));
        srcMol.code     = srcCode.splice(srcIdx, 1);
        if (isMol) {if (srcIdx >= srcMol.code.length) {srcIdx--} srcMol.code[srcIdx] |= CODE_8_BIT_MASK}
        Compiler.compile(org, false);                     // Safe recompilation without loosing metadata
        Compiler.updateMetadata(org, dstIdx, dstIdx, 1);
    }

    static _onPeriod (vm, code, org) {if (!Config.codeMutateMutations || Config.orgMaxAge < 1) {return} org.period = rand(Config.orgMaxAge) + 1}

    static _onPercent(vm, code, org) {if (!Config.codeMutateMutations) {return} org.percent = Math.random() || CODE_MUTATION_AMOUNT}

    static _onProbs  (vm, code, org) {org.probs[rand(ORG_PROBS)] = rand(ORG_PROB_MAX_VALUE) + 1}
    
    // static _onInsert (vm, code, org) {
    //     if (code.length >= Config.orgMaxCodeSize) {return}
    //     const idx    = rand(code.length);
    //     org.code     = code.splice(idx, 0, Uint8Array.from([Mutations.randCmd()]));
    //     Compiler.compile(org, false);                     // Safe recompilation without loosing metadata
    //     Compiler.updateMetadata(org, idx, idx + 1, 1);
    // }

    // /**
    //  * Takes few lines from itself and inserts them before or after copied
    //  * part. All positions are random.
    //  * @return {Number} Amount of added/copied lines
    //  */
    // static _onCopy   (vm, code, org)  {
    //     const codeLen = code.length;
    //     const start   = rand(codeLen);
    //     const end     = start + rand(codeLen - start);
    //     //
    //     // Because we use spread (...) operator stack size is important
    //     // for amount of parameters and we shouldn't exceed it
    //     //
    //     if (end - start > CODE_MAX_STACK_SIZE) {return 0}
    //     //
    //     // Organism size should be less them codeMaxSize
    //     //
    //     if (codeLen + end - start >= Config.orgMaxCodeSize) {return 0}
    //     //
    //     // We may insert copied piece before "start" (0) or after "end" (1)
    //     //
    //     if (rand(2) === 0) {
    //         const idx = rand(start);
    //         const insCode = code.slice(start, end);
    //         org.code      = code.splice(idx, 0, insCode);
    //         Compiler.compile(org, false);                     // Safe recompilation without loosing metadata
    //         Compiler.updateMetadata(org, idx, idx + insCode.length, 1);
    //         return end - start;
    //     }

    //     const idx     = end + rand(codeLen - end + 1);
    //     const insCode = code.slice(start, end);
    //     org.code      = code.splice(idx, 0, insCode);
    //     Compiler.compile(org, false);                     // Safe recompilation without loosing metadata
    //     Compiler.updateMetadata(org, idx, idx + insCode.length, 1);

    //     return end - start;
    // }

    // static _onCut    (vm, code, org)  {
    //     const start = rand(code.length);
    //     const end   = rand(code.length - start);
    //     org.code    = code.splice(start, end);
    //     Compiler.compile(org, false);                     // Safe recompilation without loosing metadata
    //     Compiler.updateMetadata(org, start, start + end, -1);
    // }

    // static _onOff    (vm, code, org) {
    //     const idx = rand(code.length);
    //     code[idx] = (code[idx] & CODE_8_BIT_MASK) ? NOP_MOL : NOP;
    //     Compiler.compile(org, false);                     // Safe recompilation without loosing metadata
    //     Compiler.updateMetadata(org, idx, idx, 1);
    // }
}

/**
 * Static mutation methods binding. Is used for running specified mutation type
 * @private
 */
Mutations._MUTATION_CBS = [
    Mutations._onChange.bind(this),
    Mutations._onDel.bind(this),
    Mutations._onAdd.bind(this),
    Mutations._onPeriod.bind(this),
    Mutations._onPercent.bind(this),
    Mutations._onProbs.bind(this)
    // Mutations._onInsert.bind(this),
    // Mutations._onCopy.bind(this),
    // Mutations._onCut.bind(this),
    // Mutations._onOff.bind(this)
];
/**
 * {Array} Names of mutation types
 */
Mutations.NAMES = [
    'chen',
    'dele',
    'add',
    'peri',
    'perc',
    'prob'
    // 'ins',
    // 'copy',
    // 'cut',
    // 'off'
];

module.exports = Mutations;