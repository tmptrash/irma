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
// TODO: review all configs
const WIDTH     = 1920 * 2;
const HEIGHT    = 1080 * 2;
const CODE_OFFS = 1024;

const Config = {
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
    CODE_COMMANDS              : 49,
    /**
     * {Number} Functions call stack size
     */
    CODE_STACK_SIZE            : 300,
    codeLinesPerIteration      : 2000,
    codeTimesPerRun            : 10,
    codeCrossoverEveryClone    : 15,
    codeMutateEveryClone       : 10,
    codeRegs                   : 6,
    codeLuca                   : [
        CODE_OFFS + 24, // func
        1023,           //   1023
        CODE_OFFS,      //   toggle
        6,              //   6
        CODE_OFFS + 6,  //   add
        CODE_OFFS,      //   toggle
        -1,             //   -1
        CODE_OFFS,      //   toggle
        CODE_OFFS + 36, //   find
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
        CODE_OFFS + 25, //       ret
        CODE_OFFS + 26, //     end
        CODE_OFFS + 1,  //     shift
        CODE_OFFS + 1,  //     shift
        CODE_OFFS,      //     toggle
        CODE_OFFS + 28, //     axret
        CODE_OFFS + 1,  //     shift
        CODE_OFFS + 3,  //     pop
        CODE_OFFS,      //     toggle
        CODE_OFFS + 27, //     retax
        CODE_OFFS + 11, //     dec
        CODE_OFFS,      //     toggle
        CODE_OFFS + 18, //     ifg
        CODE_OFFS + 3,  //       pop
        CODE_OFFS + 25, //       ret
        CODE_OFFS + 26, //     end
        CODE_OFFS + 48, //     len
        CODE_OFFS + 37, //     move
        CODE_OFFS + 3,  //     pop
        CODE_OFFS + 10, //     inc
        CODE_OFFS,      //     toggle
        CODE_OFFS + 3,  //     pop
        CODE_OFFS + 26, //   end
        CODE_OFFS + 1,  //   shift
        CODE_OFFS + 1,  //   shift
        CODE_OFFS + 48, //   len
        CODE_OFFS,      //   toggle
        CODE_OFFS + 34, //   split
        CODE_OFFS + 26, // end
        CODE_OFFS + 24, // func
        CODE_OFFS + 14, //   rand
        CODE_OFFS + 35, //   step
        CODE_OFFS,      //   toggle
        CODE_OFFS + 48, //   len
        CODE_OFFS,      //   toggle
        CODE_OFFS + 33, //   join
        CODE_OFFS + 26, // end
        100,            // 100
        CODE_OFFS + 22, // loop
        1,              //   1
        CODE_OFFS + 23, //   call
        CODE_OFFS + 26, // end
        0,              // 0
        CODE_OFFS + 23, // call
        CODE_OFFS + 25, // ret
        CODE_OFFS + 5   // nop
    ],

    /**
     * World width in pixels
     * @constant
     */
    WORLD_WIDTH                : WIDTH,
    /**
     * World height in pixels
     * @constant
     */
    WORLD_HEIGHT               : HEIGHT,
    /**
     * {Number} Zoom speed 0..1
     */
    worldZoomSpeed             : 0.1,
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
     * {Number} Mask to check if some dot is an energy. We use second bit
     * for this. First bit is used to check if it's an organism
     */
    energyValue                : .5,

    /**
     * {Number} Maximum value of every element in orgProbs array
     * @constant
     */
    ORG_PROB_MAX_VALUE         : 50,
    ORG_MASK                   : 0x80000000,
    orgAmount                  : 30000,
    orgMaxAge                  : 2000000,
    orgEnergy                  : 49,
    orgStepEnergy              : .001,
    orgEnergyPeriod            : 0,
    orgColor                   : 0xff0000,
    orgMutationPercent         : .02,
    orgMutationPeriod          : 250000,
    orgMaxCodeSize             : 256,
    orgMoleculeCodeSize        : 16,
    /**
     * {Array} change,del,period,amount,probs,insert,copy,cut
     * Is used for new created organisms. During cloning, all
     * organism properties will be inherited.
     */
    orgProbs                   : new Uint32Array([10,1,2,3,1,5,1,1]),
    /**
     * {Number} Ages we decrease from organism is case of running these commands.
     * In some sense this is amount of energy for commands
     */
    ageJoin                    : 10,
    ageMove                    : 20
};

module.exports = Config;