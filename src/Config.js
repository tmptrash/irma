/**
 * {Object} Global configuration of IRMA project. Very important idea
 * behind these configs is total amount of energy in a world. It should
 * be a luck of energy to provoke system to grow. To calculate amount of
 * energy dots we have to use formula:
 *
 *   dots = ((orgCloneEnergy - 1) * orgAmount - orgAmount * orgEnergy) / energyValue
 *
 * Some of these configuration parameters may be changed during app work.
 * Some of them - not. See "@constant" mark in a comment.
 *
 * @author flatline
 */
const Config = {
    /**
     * {Number} This offset will be added to commands value. This is how we
     * add an ability to use numbers in a code, just putting them as command
     * @constant
     */
    CODE_CMD_OFFS         : 128,
    /**
     * {Number} Amount of supported commands in a code. This value must be
     * synchronized with real commands amount. See VM.js for details.
     * @constant
     */
    CODE_COMMANDS         : 24,
    codeLinesPerIteration : 4,
    codeTimesPerRun       : 4,

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
    worldSurfacesDelay    : 300,
    worldSurfaces         : [{     // lava
        color : 0xff8881 ,
        energy: 3,
        step  : .5,
        amount: 50000
    }, {                           // water
        color : 0x0000f2,
        energy: 0,
        step  : .8,
        amount: 1000000
    }/*, {                           // hole
        color : 0xaaaaa3,
        energy: 100,
        step  : 0,
        amount: 1000
    }*/, {                           // sand
        color : 0xFFFF03,
        energy: .1,
        step  : .3,
        amount: 50000
    }],

    energyColor           : 0x00ff00,
    energyValue           : 100,
    energyAmount          : 800000,

    /**
     * {Number} Maximum value of every element in orgProbs array
     * @constant
     */
    ORG_PROB_MAX_VALUE    : 100,
    orgAmount             : 50000,
    orgMaxAge             : 100000,
    orgEnergy             : 1000,
    orgEnergyPeriod       : 200,
    orgCloneEnergy        : 3000,
    orgColor              : 0xff0000,
    orgMemSize            : 64,
    orgMutationPercent    : .02,
    orgMutationPeriod     : 20000,
    orgMaxCodeSize        : 512,
    orgStartCodeSize      : 32,
    /**
     * {Array} change,del,period,amount,probs,insert,copy,cut
     * Is used for new created organisms. During cloning, all
     * organism properties will be inherited.
     */
    orgProbs              : [20,1,3,5,1,10,1,1]
};

module.exports = Config;