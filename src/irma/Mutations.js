/**
 * @author flatline
 */
const Config = require('./../Config');
const Helper = require('./../common/Helper');

const rand                 = Helper.rand;
/**
 * {Number} Amount of mutation probabilities values.
 */
const ORG_PROBS            = Config.orgProbs.length;
/**
 * {Number} Maximum probability value for array of probabilities
 */
const ORG_PROB_MAX_VALUE   = Config.ORG_PROB_MAX_VALUE;
/**
 * {Number} This offset will be added to commands value. This is how we
 * add an ability to use numbers in a code, just putting them as command
 */
const CODE_CMD_OFFS        = Config.CODE_CMD_OFFS;
/**
 * {Number} Amount of supported commands in a code
 */
const CODE_COMMANDS        = Config.CODE_COMMANDS;
/**
 * {Number} Maximum stack size, which may be used for recursion or function parameters
 */
const CODE_MAX_STACK_SIZE  = 30000;
/**
 * {Number} Default amount of mutations
 */
const CODE_MUTATION_AMOUNT = .02;

class Mutations {
    /**
     * Apply mutations to specified organism
     * @param {Organism} org
     */
    static mutate(org) {
        const mutCbs  = Mutations._MUTATION_CBS;
        const probArr = org.probArr;
        const pLen    = probArr.length;
        for (let m = 0, len = ((org.code.length * org.percent) << 0) || 1; m < len; m++) {
            mutCbs[probArr[rand(pLen)]](org.code, org);
        }
    }

    static randCmd() {return rand(CODE_COMMANDS) === 0 ? rand(CODE_CMD_OFFS * 2) - CODE_CMD_OFFS : rand(CODE_COMMANDS) + CODE_CMD_OFFS}

    static crossover(destOrg, srcOrg) {
        const destCode = destOrg.code;
        const srcCode  = srcOrg.code;
        const codeLen  = destCode.length < srcCode.length ? destCode.length : srcCode.length;
        const start    = rand(codeLen);
        const end      = start + rand(codeLen - start);

        destCode.splice(start, end - start + 1, ...srcCode.slice(start, end + 1));
    }

    static _onChange (code, org) {code[rand(code.length)] = Mutations.randCmd(); org.preprocess()}
    static _onDel    (code, org) {code.splice(rand(code.length), 1); org.preprocess()}
    static _onPeriod (code, org) {org.period = rand(Config.orgMaxAge) + 1}
    static _onPercent(code, org) {org.percent = Math.random() || CODE_MUTATION_AMOUNT}
    static _onProbs  (code, org) {org.probs[rand(ORG_PROBS)] = rand(ORG_PROB_MAX_VALUE) + 1; org.probArr = org.createProbArr()}
    static _onInsert (code, org) {
        if (code.length >= Config.orgMaxCodeSize) {return}
        code.splice(rand(code.length), 0, Mutations.randCmd());
        org.preprocess();
    }
    /**
     * Takes few lines from itself and inserts them before or after copied
     * part. All positions are random.
     * @return {Number} Amount of added/copied lines
     */
    static _onCopy   (code, org)  {
        const codeLen = code.length;
        const start   = rand(codeLen);
        const end     = start + rand(codeLen - start);
        //
        // Because we use spread (...) operator stack size is important
        // for amount of parameters and we shouldn't exceed it
        //
        if (end - start > CODE_MAX_STACK_SIZE) {return 0}
        //
        // Organism size should be less them codeMaxSize
        //
        if (codeLen + end - start >= Config.orgMaxCodeSize) {return 0}
        //
        // We may insert copied piece before "start" (0) or after "end" (1)
        //
        if (rand(2) === 0) {
            code.splice(rand(start), 0, ...code.slice(start, end));
            org.preprocess();
            return end - start;
        }

        code.splice(end + rand(codeLen - end + 1), 0, ...code.slice(start, end));
        org.preprocess();

        return end - start;
    }
    static _onCut    (code, org)  {code.splice(rand(code.length), rand(code.length)); org.preprocess()}
}
/**
 * Static mutation methods binding. Is used for running specified mutation type
 * @private
 */
Mutations._MUTATION_CBS = [
    Mutations._onChange.bind(this),
    Mutations._onDel.bind(this),
    Mutations._onPeriod.bind(this),
    Mutations._onPercent.bind(this),
    Mutations._onProbs.bind(this),
    Mutations._onInsert.bind(this),
    Mutations._onCopy.bind(this),
    Mutations._onCut.bind(this)
];

module.exports = Mutations;