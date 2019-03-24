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
/**
 * {Number} This offset will be added to commands value. This is how we
 * add an ability to use numbers in a code, just putting them as command
 * @constant
 */
const CMD_OFFS = 128;

const Config = {
    /**
     * {Array} Array of increments. Using it we may obtain coordinates of the
     * point depending on one of 8 directions. We use these values in any command
     * related to sight, move, eating and so on
     */
    DIRX                       : [0,   1, 1, 1, 0, -1, -1, -1],
    DIRY                       : [-1, -1, 0, 1, 1,  1,  0, -1],
    /**
     * {Number} This offset will be added to commands value. This is how we
     * add an ability to use numbers in a code, just putting them as command
     * @constant
     */
    CODE_CMD_OFFS              : CMD_OFFS,
    /**
     * {Number} Amount of supported commands in a code. This value must be
     * synchronized with real commands amount. See VM.js for details.
     * @constant
     */
    CODE_COMMANDS              : 28,
    /**
     * {Number} Functions call stack size
     */
    CODE_STACK_SIZE            : 1000,
    codeLinesPerIteration      : 10,
    codeTimesPerRun            : 3,
    codeCrossoverEveryClone    : 10,
    codeMutateEveryClone       : 3,
    codeDefault                : [CMD_OFFS+23, CMD_OFFS, CMD_OFFS+1, CMD_OFFS+2],

    /**
     * World width in pixels
     * @constant
     */
    WORLD_WIDTH                : 1920 * 2,
    /**
     * World height in pixels
     * @constant
     */
    WORLD_HEIGHT               : 1080 * 2,
    /**
     * {Number} Zoom speed 0..1
     */
    worldZoomSpeed             : 0.1,
    worldCataclysmCheck        : 100,
    /**
     * {Number} Percent of differences between organisms after which global
     * cataclysm mechanism will be run.
     */
    worldOrgsSimilarityPercent : .3,
    /**
     * {Array} Array of surfaces. These surfaces are analogs of water, sand
     * lava and other stuff. They are moving to some randomly selected point
     * in a world all the time like water tides, earth layers moving and so on.
     * Every surface has 4 parameters:
     *  color  - dots color. % 16 with this color should get index of surface starting from 1
     *  energy - amount of energy, which grabs if organism above the surface
     *  step   - coefficient of speed (slow down) if organism above the surface
     *  amount - amount of surface dots
     */
    worldSurfaces              : [/*{ // lava
        color    : 0xff8881,
        barrier  : false,
        energy   : 1,
        step     : 3,
        radiation: .1,
        delay    : 20,
        amount   : 100000,
        block    : .96
    },*/ {                            // water
        color    : 0x0000f1,
        barrier  : false,
        energy   : 0,
        step     : 15,
        radiation: 0,
        delay    : 0,
        amount   : 1000000,
        block    : .99
    },/* {                            // hole
        color    : 0xaaaaa3,
        barrier  : false,
        energy   : 100,
        step     : 0,
        radiation: 0,
        delay    : 100,
        amount   : 10000,
        block    : .96
    }, {                              // sand
        color    : 0xFFFF02,
        barrier  : false,
        energy   : .001,
        step     : 2,
        radiation: 0,
        delay    : 50,
        amount   : 200000,
        block    : .96
    }, {                              // radiation
        color    : 0xFFFFF3,
        barrier  : false,
        energy   : 0,
        step     : 1,
        radiation: 1,
        delay    : 50,
        amount   : 20000,
        block    : .96
    },*/ {
        color    : 0xBBBBB2,          // stones
        barrier  : true,
        energy   : 0,
        step     : 0,
        radiation: 0,
        delay    : 100,
        amount   : 200000,
        block    : .96
    }],
    /**
     * {Boolean} Turns on\off usage of IndexedDB for storing organisms population
     * @constant
     */
    DB_ON                      : false,
    DB_CHUNK_SIZE              : 200,
    /**
     * {Number} Mask to check if some dot is an energy. We use second bit
     * for this. First bit is used to check if it's an organism
     */
    ENERGY_MASK                : 0x40000000,
    energyColor                : 0x00ff00,
    energyValue                : 30,
    energyAmount               : 10000,
    energyBlockPercent         : .99,

    /**
     * {Number} Maximum value of every element in orgProbs array
     * @constant
     */
    ORG_PROB_MAX_VALUE         : 100,
    orgAmount                  : 10000,
    orgGrabEnergyPercent       : .01,
    orgMaxAge                  : 100000,
    orgEnergy                  : 100,
    orgCloneEnergy             : 100,
    orgEnergyPeriod            : 1000,
    orgColor                   : 0xff0000,
    orgMemSize                 : 64,
    orgMutationPercent         : .02,
    orgMutationPeriod          : 250000,
    orgMaxCodeSize             : 512,
    orgStartCodeSize           : 64,
    orgRandCodeOnStart         : true,
    /**
     * {Array} change,del,period,amount,probs,insert,copy,cut
     * Is used for new created organisms. During cloning, all
     * organism properties will be inherited.
     */
    orgProbs                   : [20,1,3,5,1,10,1,1]
};

module.exports = Config;