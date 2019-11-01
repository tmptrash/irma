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
const WIDTH     = 1920 * 3;
const HEIGHT    = 1080 * 3;
const CODE_OFFS = 1024;


// TODO: rename all molecules related names to prefix "mol"
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
    CODE_COMMANDS              : 50,
    /**
     * {Number} Functions call stack size
     * @constant
     */
    CODE_STACK_SIZE            : 300,
    codeLinesPerIteration      : 1,
    codeTimesPerRun            : 1,
    codeMutateEveryClone       : 2,
    codeRegs                   : 6,
    codeMixTimes               : 4,
    codeMutateMutations        : false,
    codeLuca                   : [
        CODE_OFFS + 24, // func
        3,              //   3
        CODE_OFFS + 23, //   call
        CODE_OFFS + 27, //   retax
        CODE_OFFS,      //   toggle
        CODE_OFFS + 48, //   len
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
        CODE_OFFS + 36, //     find
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
        CODE_OFFS + 18, //     ifg
        CODE_OFFS + 3,  //       pop
        CODE_OFFS + 3,  //       pop
        CODE_OFFS + 1,  //       shift
        CODE_OFFS + 1,  //       shift
        CODE_OFFS + 25, //       ret
        CODE_OFFS + 26, //     end
        CODE_OFFS + 48, //     len
        CODE_OFFS + 37, //     move
        CODE_OFFS + 3,  //     pop
        CODE_OFFS + 10, //     inc
        CODE_OFFS,      //     toggle
        CODE_OFFS + 3,  //     pop
        CODE_OFFS + 26, //   end
        CODE_OFFS,      //   toggle
        CODE_OFFS + 48, //   len
        CODE_OFFS + 7,  //   sub
        CODE_OFFS,      //   toggle
        17,             //   17
        CODE_OFFS + 28, //   axret
        CODE_OFFS + 48, //   len
        CODE_OFFS,      //   toggle
        CODE_OFFS + 34, //   split
        CODE_OFFS + 26, // end
        CODE_OFFS + 24, // func
        1,              //   1
        CODE_OFFS + 38, //   see
        CODE_OFFS + 15, //   ifp
        2,              //     2
        CODE_OFFS + 26, //   end
        CODE_OFFS + 17, //   ifz
        -1,             //     -1
        CODE_OFFS + 14, //     rand
        CODE_OFFS + 35, //     step
        CODE_OFFS + 35, //     step
        CODE_OFFS + 35, //     step
        CODE_OFFS + 26, //   end
        CODE_OFFS,      //   toggle
        CODE_OFFS + 48, //   len
        CODE_OFFS,      //   toggle
        CODE_OFFS + 4,  //   push
        1,              //   1
        CODE_OFFS + 28, //   axret
        CODE_OFFS + 3,  //   pop
        CODE_OFFS + 33, //   join
        CODE_OFFS + 26, // end
        CODE_OFFS + 24, // func
        900,            //   900
        CODE_OFFS,      //   toggle
        CODE_OFFS + 48, //   len
        CODE_OFFS + 19, //   ifl
        CODE_OFFS + 25, //     ret
        CODE_OFFS + 26, //   end
        3,              //   3
        CODE_OFFS + 23, //   call
        CODE_OFFS + 27, //   retax
        CODE_OFFS,      //   toggle
        CODE_OFFS + 48, //   len
        CODE_OFFS + 7,  //   sub
        CODE_OFFS + 14, //   rand
        CODE_OFFS + 6,  //   add
        CODE_OFFS,      //   toggle
        0,              //   0
        CODE_OFFS + 28, //   axret
        CODE_OFFS + 48, //   len
        CODE_OFFS,      //   toggle
        CODE_OFFS + 34, //   split
        CODE_OFFS + 26, // end
        CODE_OFFS + 24, // func
        0,              //   0
        CODE_OFFS + 28, //   axret
        1023,           //   1023
        CODE_OFFS,      //   toggle
        6,              //   6
        CODE_OFFS + 6,  //   add
        CODE_OFFS,      //   toggle
        -1,             //   -1
        CODE_OFFS,      //   toggle
        CODE_OFFS + 36, //   find
        CODE_OFFS + 28, //   axret
        CODE_OFFS + 26, // end
        255,            // 255
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 13, // lshift
        CODE_OFFS + 49, // color
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
    ],

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
    WORLD_CANVAS_WIDTH         : 800,
    WORLD_CANVAS_HEIGHT        : 500,
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
    ORG_MIN_COLOR              : 0x96,
    orgLucaAmount              : 100,
    orgMaxAge                  : 5000000,
    orgMutationPercent         : .01,
    orgMutationPeriod          : 120001,
    orgMaxCodeSize             : 1024,
    orgMaxMemSize              : 128,
    /**
     * {Array} change,del,period,amount,probs,insert,copy,cut
     * Is used for new created organisms. During cloning, all
     * organism properties will be inherited.
     */
    orgProbs                   : new Uint32Array([10,1,2,3,1,5,1,1]),
    /**
     * Molecules related configs
     */
    molDecayPeriod             : 1,
    molDecayDistance           : 60,
    molAmount                  : 4000000,
    molCodeSize                : 8,
    molColor                   : 0xff0000,
    /**
     * {Number} Ages we decrease from organism is case of running these commands.
     * In some sense this is amount of energy for commands
     */
    energyMove                 : 10,
    energyStepCoef             : .02,
    energyMultiplier           : 4000,
    /**
     * Plugins. Extends irma core by additional functionality
     * @constant
     */
    PLUGINS                    : ['Decay']
};