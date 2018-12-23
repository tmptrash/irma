/**
 * {Object} Global configuration of IRMA project. Very important idea
 * behind these configs is total amount of energy in a world. It should
 * be a luck of energy to provoke system to grow. To calculate percent
 * of this energy we have to use formula:
 *
 *   energy             = (orgCloneEnergy - 1) * orgAmount
 *   dots               = ((orgCloneEnergy - 1) * orgAmount - orgAmount * orgEnergy) / energyValue
 *   worldEnergyPercent = ((orgCloneEnergy - 1) * orgAmount - orgAmount * orgEnergy) / (WORLD_WIDTH * WORLD_HEIGHT * energyValue)
 *
 * Some of these configuration parameters may be changed during app work.
 * Some of them - not. See "@constant" mark in a comment.
 *
 * @author flatline
 */
const Config = {
    /**
     * {Number} Maximum value of every element in orgProbs array
     * @constant
     */
    ORG_PROB_MAX_VALUE  : 100,
    /**
     * {Number} Maximum period between mutations
     * @constant
     */
    ORG_MAX_PERIOD      : 5000,
    /**
     * {Number} This offset will be added to commands value. This is how we
     * add an ability to use numbers in a code, just putting them as command
     */
    CODE_CMD_OFFS       : 128,
    /**
     * {Number} Amount of supported commands in a code
     */
    CODE_COMMANDS       : 21,
    /**
     * World width in pixels
     * @constant
     */
    WORLD_WIDTH         : 1000,
    /**
     * World height in pixels
     * @constant
     */
    WORLD_HEIGHT        : 660,

    worldEnergyPercent  : .088,
    worldEnergyAddPeriod: 200000,

    energyValue         : 50,
    energyColor         : 0x00ff00,

    linesPerIteration   : 4,
    iterationsPerRun    : 10,

    orgAmount           : 20000,
    orgMaxAge           : 1000000,
    orgEnergy           : 1000,
    orgEnergyPeriod     : 30,
    orgCloneEnergy      : 3000,
    orgColor            : 0xff0000,
    orgMemSize          : 64,
    orgMutationPercent  : .2,
    orgMutationPeriod   : 2000,
    orgCodeMaxSize      : 1000,
    /**
     * {Array}
     * change,del,period,amount,probs,insert,copy,cut
     */
    orgProbs            : [50,1,3,5,1,20,1,1]
};

module.exports = Config;