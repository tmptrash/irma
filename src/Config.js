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

    worldWidth          : 300,
    worldHeight         : 300,
    worldEnergyPercent  : .3,
    worldEnergyAddPeriod: 200000,

    energyValue         : 100,
    energyColor         : 0x00ff00,

    linesPerIteration   : 5,
    iterationsPerRun    : 10,

    orgAmount           : 5000,
    orgMaxAge           : 100000,
    orgEnergy           : 1000,
    orgEnergyPeriod     : 50,
    orgColor            : 0xff0000,
    orgMemSize          : 64,
    orgMutationPercent  : .2,
    orgMutationPeriod   : 4000,
    orgProbs            : [5,1,3,5,1,20,1,1], // change,del,period,amount,probs,insert,copy,cut
    orgCodeMaxSize      : 1000
};

module.exports = Config;