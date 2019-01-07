/**
 * @author flatline
 */
const Config = require('./../Config');
const Helper = require('./../common/Helper');

const round  = Math.round;
const rand   = Helper.rand;

/**
 * {Number} Amount of supported commands in a code
 */
const CODE_COMMANDS = Config.CODE_COMMANDS;
/**
 * {Number} Amount of probability elements
 */
const PROBS    = Config.orgProbs.length;
/**
 * {Number} Maximum probability value for array of probabilities
 */
const ORG_PROB_MAX_VALUE = Config.ORG_PROB_MAX_VALUE;
/**
 * {Number} This offset will be added to commands value. This is how we
 * add an ability to use numbers in a code, just putting them as command
 */
const CODE_CMD_OFFS = Config.CODE_CMD_OFFS;
/**
 * {Number} Maximum stack size, which may be used for recursion or function parameters
 */
const MAX_STACK_SIZE = 30000;
/**
 * {Number} Maximum period of mutation for one organism
 */
const ORG_MAX_PERIOD = Config.ORG_MAX_PERIOD;

class Mutations {
    /**
     * Updates mutations for specified organism
     * @param org
     */
    static update(org) {
        const age = org.age;
        if (age % Config.orgMutationPeriod === 0) {
            const code      = org.code;
            const mutations = round(code.length * Config.orgMutationPercent) || 1;
            const prob      = Helper.probIndex;
            const probs     = Mutations._probsCbs;
            for (let m = 0; m < mutations; m++) {probs[prob(org.probs)](code, org)}
        }
    }

``    static getRandCmd() {
        return rand(CODE_COMMANDS) === 0 ? rand(CODE_CMD_OFFS * 2) - CODE_CMD_OFFS : rand(CODE_COMMANDS) + CODE_CMD_OFFS;
    }

    static _onChange(code)      {code[rand(code.length)] = Mutations.getRandCmd()}
    static _onDel   (code)      {code.splice(rand(code.length), 1)}
    static _onPeriod(code, org) {org.period = rand(ORG_MAX_PERIOD) + 1}
    static _onAmount(code, org) {org.percent = Math.random()}
    static _onProbs (code, org) {org.probs[rand(PROBS)] = rand(ORG_PROB_MAX_VALUE)}
    static _onInsert(code)      {code.splice(rand(code.length), 0, rand(CODE_COMMANDS) === 0 ? rand(CODE_CMD_OFFS) : rand(CODE_COMMANDS) + CODE_CMD_OFFS)}
    /**
     * Takes few lines from itself and inserts them before or after copied
     * part. All positions are random.
     * @return {Number} Amount of added/copied lines
     */
    static _onCopy  (code)      {
        const codeLen = code.length;
        const start   = rand(codeLen);
        const end     = start + rand(codeLen - start);
        //
        // Because we use spread (...) operator stack size is important
        // for amount of parameters and we shouldn't exceed it
        //
        if (end - start > MAX_STACK_SIZE) {return 0}
        //
        // Organism size should be less them codeMaxSize
        //
        if (codeLen + end - start >= Config.orgMaxCodeSize) {return 0}
        //
        // We may insert copied piece before "start" (0) or after "end" (1)
        //
        if (rand(2) === 0) {
            code.splice(rand(start), 0, ...code.slice(start, end));
            return end - start;
        }

        code.splice(end + rand(codeLen - end + 1), 0, ...code.slice(start, end));

        return end - start;
    }
    static _onCut   (code)      {code.splice(rand(code.length), rand(code.length))}
}

/**
 * Static mutation methods binding. Is used for running specified mutatio type
 * @private
 */
Mutations._probsCbs   = [
    Mutations._onChange.bind(this),
    Mutations._onDel.bind(this),
    Mutations._onPeriod.bind(this),
    Mutations._onAmount.bind(this),
    Mutations._onProbs.bind(this),
    Mutations._onInsert.bind(this),
    Mutations._onCopy.bind(this),
    Mutations._onCut.bind(this)
];


module.exports = Mutations;