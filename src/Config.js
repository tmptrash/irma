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
     * {Array} Array of increments. Using it we may obtain coordinates of the
     * point depending on one of 8 directions. We use these values in any command
     * related to sight, move, eating and so on
     */
    DIRX                  : [0,   1, 1, 1, 0, -1, -1, -1],
    DIRY                  : [-1, -1, 0, 1, 1,  1,  0, -1],
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
    codeLinesPerIteration : 6,
    codeTimesPerRun       : 50,

    /**
     * World width in pixels
     * @constant
     */
    WORLD_WIDTH           : 1920,
    /**
     * World height in pixels
     * @constant
     */
    WORLD_HEIGHT          : 1080,
    worldSurfacesDelay    : 1,
    /**
     * {Number} Zoom speed 0..1
     */
    worldZoomSpeed        : 0.1,
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
    worldSurfaces         : [/*{     // lava
        color : 0xff8881,
        energy: .2,
        step  : 3,
        amount: 50000,
        block : .9
    },*/ {                           // water
        color : 0x0000f1,
        energy: 0,
        step  : 3,
        amount: 500000,
        block : .9
    }/*, {                           // hole
        color : 0xaaaaa3,
        energy: 100,
        step  : 0,
        amount: 1000,
        block : .9
    }, {                           // sand
        color : 0xFFFF04,
        energy: .01,
        step  : 2,
        amount: 50000,
        block : .9
    }*/],
    /**
     * {Number} Mask to check if some dot is an energy. We use second bit
     * for this. First bit is used to check if it's an organism
     */
    ENERGY_MASK           : 0x40000000,
    energyColor           : 0x00ff00,
    energyValue           : 50,
    energyAmount          : 16000,
    energyBlockPercent    : .9,

    /**
     * {Number} Maximum value of every element in orgProbs array
     * @constant
     */
    ORG_PROB_MAX_VALUE    : 100,
    orgAmount             : 1000,
    orgMaxAge             : 100000,
    orgEnergy             : 1000,
    orgCloneEnergy        : 2000,
    orgEnergyPeriod       : 200,
    orgColor              : 0xff0000,
    orgMemSize            : 64,
    orgMutationPercent    : .02,
    orgMutationPeriod     : 10000,
    orgMaxCodeSize        : 512,
    orgStartCodeSize      : 64,
    /**
     * {Array} change,del,period,amount,probs,insert,copy,cut
     * Is used for new created organisms. During cloning, all
     * organism properties will be inherited.
     */
    orgProbs              : [20,1,3,5,1,10,1,1]
};

module.exports = Config;