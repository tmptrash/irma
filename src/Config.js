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
const CODE_OFFS   = 256 - 64;
const CODE_ORG_ID = 17;

// TODO: rename all molecules related names to prefix "mol".
// TODO: do we really can change all non constants in real time? worldZoomSpeed,...
// TODO: add comments for every config parameter
module.exports = {
    /**
     * {Array} Array of increments. Using it we may obtain coordinates of the
     * nearest point depending on one of 8 directions. We use these values in any
     * command related to sight, move, eating and so on. Starts from: uo, up-right,
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
    CODE_COMMANDS              : 53,
    /**
     * {Number} Functions call stack size
     * @constant
     */
    CODE_STACK_SIZE            : 300,
    CODE_RET_OK                : 1,
    CODE_RET_ERR               : 0,
    CODE_ORG_ID,
    CODE_LUCA                   : Uint8Array.from([
        CODE_OFFS + 24, // func
        3,              //   3
        CODE_OFFS + 23, //   call
        CODE_OFFS + 27, //   retax
        CODE_OFFS,      //   toggle
        CODE_OFFS + 37, //   len
        CODE_OFFS,      //   toggle
        CODE_OFFS + 4,  //   push
        CODE_OFFS + 1,  //   shift
        CODE_OFFS + 3,  //   pop
        CODE_OFFS,      //   toggle
        0,              //   0
        CODE_OFFS,      //   toggle
        CODE_OFFS + 10, //   inc
        CODE_OFFS + 22, //   loop
        CODE_OFFS + 28, //     axret
        CODE_OFFS + 4,  //     push
        CODE_OFFS + 2,  //     eq
        CODE_OFFS + 4,  //     push
        CODE_OFFS + 33, //     find
        CODE_OFFS + 4,  //     push
        CODE_OFFS + 27, //     retax
        CODE_OFFS + 17, //     ifz
        CODE_OFFS + 3,  //       pop
        CODE_OFFS + 3,  //       pop
        CODE_OFFS + 3,  //       pop
        CODE_OFFS + 1,  //       shift
        CODE_OFFS + 1,  //       shift
        CODE_OFFS + 25, //       ret
        CODE_OFFS + 26, //     end
        CODE_OFFS + 1,  //     shift
        CODE_OFFS + 1,  //     shift
        CODE_OFFS,      //     toggle
        CODE_OFFS + 28, //     axret
        CODE_OFFS,      //     toggle
        CODE_OFFS + 1,  //     shift
        CODE_OFFS + 3,  //     pop
        CODE_OFFS,      //     toggle
        CODE_OFFS + 27, //     retax
        CODE_OFFS + 11, //     dec
        CODE_OFFS,      //     toggle
        CODE_OFFS + 28, //     axret
        CODE_OFFS + 3,  //     pop
        CODE_OFFS + 4,  //     push
        CODE_OFFS,      //     toggle
        CODE_OFFS + 7,  //     sub
        CODE_OFFS,      //     toggle
        CODE_OFFS + 27, //     retax
        CODE_OFFS + 18, //     ifg
        CODE_OFFS + 3,  //       pop
        CODE_OFFS + 3,  //       pop
        CODE_OFFS + 1,  //       shift
        CODE_OFFS + 1,  //       shift
        CODE_OFFS + 25, //       ret
        CODE_OFFS + 26, //     end
        CODE_OFFS + 37, //     len
        CODE_OFFS + 34, //     move
        CODE_OFFS + 3,  //     pop
        CODE_OFFS + 10, //     inc
        CODE_OFFS,      //     toggle
        CODE_OFFS + 3,  //     pop
        CODE_OFFS + 26, //   end
        CODE_OFFS,      //   toggle
        CODE_OFFS + 37, //   len
        CODE_OFFS + 7,  //   sub
        CODE_OFFS,      //   toggle
        CODE_ORG_ID,    //   17
        CODE_OFFS + 4,  //   push
        CODE_OFFS + 37, //   len
        CODE_OFFS,      //   toggle
        CODE_OFFS + 43, //   split
        CODE_OFFS + 3,  //   pop
        CODE_OFFS + 26, // end
        CODE_OFFS + 24, // func
        1,              //   1
        CODE_OFFS + 45, //   see
        CODE_OFFS + 15, //   ifp
        2,              //     2
        CODE_OFFS + 26, //   end
        CODE_OFFS + 17, //   ifz
        0,              //     0
        CODE_OFFS + 32, //     not
        CODE_OFFS + 14, //     rand
        CODE_OFFS + 44, //     step
        CODE_OFFS + 44, //     step
        CODE_OFFS + 44, //     step
        CODE_OFFS + 26, //   end
        CODE_OFFS,      //   toggle
        CODE_OFFS + 37, //   len
        CODE_OFFS,      //   toggle
        CODE_OFFS + 4,  //   push
        CODE_OFFS + 3,  //   pop
        CODE_OFFS + 42, //   join
        CODE_OFFS + 26, // end
        CODE_OFFS + 24, // func
        100,            //   100
        CODE_OFFS,      //   toggle
        5,              //   5
        CODE_OFFS + 8,  //   mul
        CODE_OFFS,      //   toggle
        CODE_OFFS + 37, //   len
        CODE_OFFS + 19, //   ifl
        CODE_OFFS + 25, //     ret
        CODE_OFFS + 26, //   end
        3,              //   3
        CODE_OFFS + 23, //   call
        CODE_OFFS + 27, //   retax
        CODE_OFFS,      //   toggle
        CODE_OFFS + 37, //   len
        CODE_OFFS + 7,  //   sub
        CODE_OFFS + 14, //   rand
        CODE_OFFS + 6,  //   add
        CODE_OFFS,      //   toggle
        0,              //   0
        CODE_OFFS + 28, //   axret
        CODE_OFFS + 37, //   len
        CODE_OFFS,      //   toggle
        CODE_OFFS + 43, //   split
        CODE_OFFS + 26, // end
        CODE_OFFS + 24, // func
        0,              //   0
        CODE_OFFS + 28, //   axret
        191,            //   191
        CODE_OFFS,      //   toggle
        6,              //   6
        CODE_OFFS + 6,  //   add
        CODE_OFFS,      //   toggle
        0,              //   0
        CODE_OFFS + 32, //   not
        CODE_OFFS,      //   toggle
        CODE_OFFS + 33, //   find
        CODE_OFFS + 28, //   axret
        CODE_OFFS + 26, // end
        128,            // 128
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 11, // dec
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 53, // color
        50,             // 50
        CODE_OFFS + 22, // loop
        1,              //   1
        CODE_OFFS + 23, //   call
        CODE_OFFS + 26, // end
        0,              // 0
        CODE_OFFS + 23, // call
        2,              // 2
        CODE_OFFS + 23, // call
        CODE_OFFS + 25, // ret
        CODE_OFFS + 5   // nop
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
    orgAmount                  : 10,
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
     * {Number} Mask, which is used for marking last atom in a molecule.
     * It means that after this atom (command) new molecule is follow. Every
     * molecule should have last atom mask turned on
     */
    MOL_LAST_ATOM_MASK         : 0b10000000,
    MOL_LAST_ATOM_RESET_MASK   : 0b01111111,
    /**
     * Molecules related configs
     */
    molDecayPeriod             : 1,
    molDecayDistance           : 60,
    molAmount                  : 60000,
    molCodeSize                : 8,
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