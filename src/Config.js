/**
 * {Object} Global configuration of IRMA project.
 * Configuration parameters, which are not constants may be changed during app work in a console
 * Constants should not be changed after app starts. See "@constant" mark in a comments.
 *
 * @author flatline
 */
/**
 * {Number} This offset will be added to commands value. This is how we
 * add an ability to use numbers in a code, just putting them as command
 * @constant
 */
const WIDTH       = 1920 / 4;
const HEIGHT      = 1080 / 4;
const CODE_OFFS   = 128 - 64;
const CODE_ORG_ID = 17;

// TODO: rename all molecules related names to prefix "mol".
// TODO: do we really can change all non constants in real time? worldZoomSpeed,...
// TODO: add comments for every config parameter
module.exports = {
    /**
     * {Array} Array of increments. Using it we may obtain coordinates of the
     * nearest point depending on one of 8 directions. We use these values in any
     * command related to sight, move, eating and so on. Starts from: up, up-right,
     * right, right-down,...
     */
    DIR                        : new Int32Array([-WIDTH, -WIDTH + 1, 1, WIDTH + 1, WIDTH, WIDTH - 1, -1, -WIDTH - 1]),
    /**
     * {Number} This offset will be added to commands value. This is how we
     * add an ability to use numbers in a code, just putting them as command
     * @constant
     */
    CODE_CMD_OFFS              : CODE_OFFS,
    /**
     * {Number} Amount of supported commands in a code. This value must be
     * synchronized with real commands amount. See VM.js for details.
     * @constant
     */
    CODE_COMMANDS              : 54,
    /**
     * {Number} Functions call stack size
     * @constant
     */
    CODE_STACK_SIZE            : 300,
    CODE_RET_OK                : 1,
    CODE_RET_ERR               : 0,
    CODE_ORG_ID,
    /**
     * {Number} Mask, which is used for marking last atom in a molecule.
     * It means that after this atom (command) new molecule is follow. Every
     * molecule should have last atom mask turned on
     */
    CODE_8_BIT_MASK            : 0b10000000,
    CODE_8_BIT_RESET_MASK      : 0b01111111,
    /**
     * {Uint8Array} Code of first organism - LUCA (Last Universal Common Ancestor)
     */
    CODE_LUCA                  : Uint8Array.from([
        CODE_OFFS + 2,  // nop
        CODE_OFFS + 2,  // nop
        CODE_OFFS + 21, // func
        CODE_OFFS + 53, //     mols
        CODE_OFFS + 8,  //     dec
        CODE_OFFS + 25, //     axret
        1,              //     1
        CODE_OFFS,      //     toggle
        0,              //     0
        CODE_OFFS + 51, //     find
        CODE_OFFS + 25, //     axret
        CODE_OFFS + 23, // end
        CODE_OFFS + 2,  // nop
        CODE_OFFS + 21, // func
        0,              //     0
        CODE_OFFS + 35, //     save
        0,              //     0
        CODE_OFFS + 20, //     call
        CODE_OFFS + 24, //     retax
        CODE_OFFS + 34, //     right
        CODE_OFFS + 35, //     save
        CODE_OFFS + 53, //     mols
        CODE_OFFS + 34, //     right
        CODE_OFFS + 35, //     save
        CODE_OFFS + 24, //     retax
        CODE_OFFS + 7,  //     inc
        CODE_OFFS + 19, //     loop
        CODE_OFFS + 36, //         load
        CODE_OFFS + 25, //         axret
        CODE_OFFS + 33, //         left
        CODE_OFFS + 36, //         load
        CODE_OFFS,      //         toggle
        CODE_OFFS + 33, //         left
        CODE_OFFS + 36, //         load
        CODE_OFFS + 51, //         find
        CODE_OFFS,      //         toggle
        CODE_OFFS + 24, //         retax
        CODE_OFFS + 14, //         ifz
        CODE_OFFS + 22, //             ret
        CODE_OFFS + 23, //         end
        CODE_OFFS + 53, //         mols
        CODE_OFFS,      //         toggle
        CODE_OFFS + 52, //         move
        CODE_OFFS + 36, //         load
        CODE_OFFS + 7,  //         inc
        CODE_OFFS + 35, //         save
        CODE_OFFS + 34, //         right
        CODE_OFFS + 36, //         load
        CODE_OFFS + 8,  //         dec
        CODE_OFFS + 35, //         save
        CODE_OFFS + 34, //         right
        CODE_OFFS + 23, //     end
        17,             //     17
        CODE_OFFS + 25, //     axret
        CODE_OFFS + 36, //     load
        CODE_OFFS,      //     toggle
        CODE_OFFS + 53, //     mols
        CODE_OFFS,      //     toggle
        CODE_OFFS + 38, //     split
        CODE_OFFS + 23, // end
        CODE_OFFS + 11, // rand
        CODE_OFFS + 39, // step
        CODE_OFFS + 37, // join
        CODE_OFFS + 2,  // nop
        1,              // 1
        CODE_OFFS + 20, // call
        CODE_OFFS + 2,  // nop
        50,             // 50
        CODE_OFFS,      // toggle
        20,             // 20
        CODE_OFFS + 5,  // mul
        CODE_OFFS,      // toggle
        CODE_OFFS + 32, // len
        CODE_OFFS + 15, // ifg
        0,              //     0
        CODE_OFFS + 20, //     call
        CODE_OFFS + 24, //     retax
        CODE_OFFS,      //     toggle
        CODE_OFFS + 53, //     mols
        CODE_OFFS,      //     toggle
        CODE_OFFS + 38, //     split
        CODE_OFFS + 23, // end
        CODE_OFFS + 2,  // nop
        CODE_OFFS + 2   // nop
    ]),
    codeLinesPerIteration      : 1,
    codeRepeatsPerRun          : 20,
    codeMutateEveryClone       : 7,
    codeMutateMutations        : false,

    /**
     * World width and height in pixels
     * @constant
     */
    WORLD_WIDTH                : WIDTH,
    WORLD_HEIGHT               : HEIGHT,
    /**
     * {Number} Size of canvas in pixels
     * @constant
     */
    WORLD_CANVAS_WIDTH         : WIDTH,
    WORLD_CANVAS_HEIGHT        : HEIGHT,
    /**
     * {Number} Zoom speed 0..1
     */
    worldZoomSpeed             : 0.1,
    worldScrollValue           : 30,
    /**
     * {Number} Amount of frequencies in a world. It uses with say/listen commands
     */
    worldFrequency             : 10,
    /**
     * {Boolean} Turns on\off usage of IndexedDB for storing organisms population
     * @constant
     */
    DB_ON                      : false,
    DB_CHUNK_SIZE              : 200,

    /**
     * {Number} Maximum value of every element in orgProbs array
     * @constant
     */
    ORG_PROB_MAX_VALUE         : 50,
    /**
     * {Number} This color is a simple fix of black organism. In this case we
     * don't see him in a world
     */
    ORG_MIN_COLOR              : 0x96,
    orgColor                   : 0xFF0000,
    orgAmount                  : 1,
    orgMaxAge                  : 5000000,
    orgMutationPercent         : .01,
    orgMutationPeriod          : 1200001,
    orgMaxCodeSize             : 1024,
    orgMaxMemSize              : 128,
    /**
     * {Array} change,del,period,amount,probs,insert,copy,cut
     * Is used for new created organisms. During cloning, all
     * organism properties will be inherited.
     */
    orgProbs                   : new Uint8Array([10,1,1,1,1,1,1,1]),
    /**
     * Molecules related configs
     */
    molDecayPeriod             : 1,
    molDecayDistance           : 60,
    molAmount                  : 60000,
    molCodeSize                : 2,
    molColor                   : 0xff0000,
    /**
     * {Number} Energy related configuration
     */
    energyStepCoef             : .015,
    energyMultiplier           : 1000,
    /**
     * Plugins. Extends irma core by additional functionality
     * @constant
     */
    PLUGINS                    : ['Decay', 'Status']
};