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
    ORG_PROB_MAX_VALUE    : 100,
    /**
     * {Number} Maximum period between mutations
     * @constant
     */
    ORG_MAX_PERIOD        : 5000,
    /**
     * {Number} This offset will be added to commands value. This is how we
     * add an ability to use numbers in a code, just putting them as command
     */
    CODE_CMD_OFFS         : 128,
    /**
     * {Number} Amount of supported commands in a code
     */
    CODE_COMMANDS         : 23,
    /**
     * World width in pixels
     * @constant
     */
    WORLD_WIDTH           : 1800,
    /**
     * World height in pixels
     * @constant
     */
    WORLD_HEIGHT          : 1200,

    worldEnergyPercent    : .099,
    worldSurfacesDelay    : 1000,
    worldSurfaces         : [{     // lava
        color : 0xff8881 ,
        energy: 10,
        step  : .5,
        amount: 50000
    }, {                           // water
        color : 0x0000f2,
        energy: 0,
        step  : .8,
        amount: 1000000
    }, {                           // hole
        color : 0xaaaaa3,
        energy: 10000,
        step  : 0,
        amount: 5000
    }, {                           // sand
        color : 0xFFFF04,
        energy: 3,
        step  : .3,
        amount: 50000
    }],

    energyColor           : 0x00ff00,
    energyValue           : 100,
    energyAmount          : 199900,

    linesPerIteration     : 4,
    iterationsPerRun      : 4,

    orgAmount             : 10000,
    orgMaxAge             : 10000,
    orgEnergy             : 1000,
    orgEnergyPeriod       : 20,
    orgCloneEnergy        : 3000,
    orgColor              : 0xff0000,
    orgMemSize            : 64,
    orgMutationPercent    : .2,
    orgMutationPeriod     : 500,
    orgCodeMaxSize        : 1024,
    /**
     * {Array}
     * change,del,period,amount,probs,insert,copy,cut
     */
    orgProbs              : [50,1,3,5,1,60,10,1]
};

module.exports = Config;