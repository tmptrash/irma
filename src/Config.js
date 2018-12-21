/**
 * {Object} Global configuration of IRMA project. Very important idea
 * behind these configs is total amount of energy in a world. It should
 * be a luck of energy to provoke system to grow. To calculate percent
 * of this energy we have to use formula:
 *
 *   energy             = (orgCloneEnergy - 1) * orgAmount
 *   dots               = ((orgCloneEnergy - 1) * orgAmount - orgAmount * orgEnergy) / energyValue
 *   worldEnergyPercent = ((orgCloneEnergy - 1) * orgAmount - orgAmount * orgEnergy) / (worldWidth * worldHeight * energyValue)
 *
 * @author flatline
 */
const Config = {
    /**
     * {Number} Maximum value of every element in orgProbs array
     * @constant
     */
    PROB_MAX_VALUE    : 100,
    /**
     * {Number} Maximum period between mutations
     * @constant
     */
    ORG_MAX_PERIOD    : 5000,
    /**
     * {Number} This offset will be added to commands value. This is how we
     * add an ability to use numbers in a code, just putting them as command
     */
    CMD_OFFS            : 128,

    worldWidth          : 3000,
    worldHeight         : 3000,
    worldEnergyPercent  : .043,
    worldEnergyAddPeriod: 200000,

    energyValue         : 100,
    energyColor         : 0x00ff00,

    linesPerIteration   : 5,
    iterationsPerRun    : 10,

    orgAmount           : 20000,
    orgMaxAge           : 100000,
    orgEnergy           : 1000,
    orgEnergyPeriod     : 30,
    orgCloneEnergy      : 3000,
    orgColor            : 0xff0000,
    orgMemSize          : 64,
    orgMutationPercent  : .2,
    orgMutationPeriod   : 4000,
    orgProbs            : [5,1,3,5,1,20,1,1], // change,del,period,amount,probs,insert,copy,cut
    orgCodeMaxSize      : 1000
};

module.exports = Config;