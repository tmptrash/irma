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
const WIDTH       = 1920;
const HEIGHT      = 1080;
const CODE_OFFS   = 128 - 64;
const CODE_ORG_ID = 17;
const COMMANDS    = {
    //
    // basic commands
    //
    TOGGLE  : CODE_OFFS,
    EQ      : CODE_OFFS + 1,
    NOP     : CODE_OFFS + 2,
    ADD     : CODE_OFFS + 3,
    SUB     : CODE_OFFS + 4,
    MUL     : CODE_OFFS + 5,
    DIV     : CODE_OFFS + 6,
    INC     : CODE_OFFS + 7,
    DEC     : CODE_OFFS + 8,
    RSHIFT  : CODE_OFFS + 9,
    LSHIFT  : CODE_OFFS + 10,
    RAND    : CODE_OFFS + 11,
    IFP     : CODE_OFFS + 12,
    IFN     : CODE_OFFS + 13,
    IFZ     : CODE_OFFS + 14,
    IFG     : CODE_OFFS + 15,
    IFL     : CODE_OFFS + 16,
    IFE     : CODE_OFFS + 17,
    IFNE    : CODE_OFFS + 18,
    LOOP    : CODE_OFFS + 19,
    CALL    : CODE_OFFS + 20,
    FUNC    : CODE_OFFS + 21,
    RET     : CODE_OFFS + 22,
    END     : CODE_OFFS + 23,
    RETAX   : CODE_OFFS + 24,
    AXRET   : CODE_OFFS + 25,
    AND     : CODE_OFFS + 26,
    OR      : CODE_OFFS + 27,
    XOR     : CODE_OFFS + 28,
    NOT     : CODE_OFFS + 29,
    AGE     : CODE_OFFS + 30,
    LINE    : CODE_OFFS + 31,
    LEN     : CODE_OFFS + 32,
    LEFT    : CODE_OFFS + 33,
    RIGHT   : CODE_OFFS + 34,
    SAVE    : CODE_OFFS + 35,
    LOAD    : CODE_OFFS + 36,
    READ    : CODE_OFFS + 37,
    CMP     : CODE_OFFS + 38,
    BREAK   : CODE_OFFS + 39,
    //
    // Biological stuff
    //
    JOIN    : CODE_OFFS + 40,
    SPLIT   : CODE_OFFS + 41,
    STEP    : CODE_OFFS + 42,
    SEE     : CODE_OFFS + 43,
    SAY     : CODE_OFFS + 44,
    LISTEN  : CODE_OFFS + 45,
    NREAD   : CODE_OFFS + 46,
    GET     : CODE_OFFS + 47,
    PUT     : CODE_OFFS + 48,
    OFFS    : CODE_OFFS + 49,
    COLOR   : CODE_OFFS + 50,
    ANAB    : CODE_OFFS + 51,
    CATAB   : CODE_OFFS + 52,
    MOVE    : CODE_OFFS + 53,
    MOL     : CODE_OFFS + 54,
    SMOL    : CODE_OFFS + 55,
    RMOL    : CODE_OFFS + 56,
    LMOL    : CODE_OFFS + 57,
    CMOL    : CODE_OFFS + 58
};

// TODO: rename all molecules related names to prefix "mol".
// TODO: do we really can change all non constants in real time? worldZoomSpeed,...
// TODO: add comments for every config parameter
module.exports = {
    /**
     * {Array} Array of increments. Using it we may obtain coordinates of the
     * nearest point depending on one of 8 directions. We use these values in any
     * command related to sight, move, eating and so on. Starts from: up, up-right,
     * right, right-down,...
     * @constant
     */
    DIR                        : new Int32Array([-WIDTH, -WIDTH + 1, 1, WIDTH + 1, WIDTH, WIDTH - 1, -1, -WIDTH - 1]),
    /**
     * {Number} This offset will be added to commands value. This is how we
     * add an ability to use numbers in a code, just putting them as command
     * @constant
     */
    CODE_CMD_OFFS              : CODE_OFFS,
    /**
     * {Object} Map of commands
     * @constant
     */
    CODE_CMDS                  : COMMANDS,
    /**
     * {Number} Amount of supported commands in a code. This value must be
     * synchronized with real commands amount. See VM.js for details.
     * @constant
     */
    CODE_COMMANDS              : Object.keys(COMMANDS).length,
    /**
     * {Number} Functions call stack size
     * @constant
     */
    CODE_STACK_SIZE            : 300,
    CODE_RET_OK                : 1,
    CODE_RET_ERR               : 0,
    CODE_RET_SPECIAL           : -1,
    CODE_ORG_ID,
    /**
     * {Number} Mask, which is used for marking last atom in a molecule.
     * It means that after this atom (command) new molecule is follow. Every
     * molecule should have last atom mask turned on
     * @constant
     */
    CODE_8_BIT_MASK            : 0b10000000,
    CODE_8_BIT_RESET_MASK      : 0b01111111,
    /**
     * Start organims array. At least one organism must be presented in this array
     * @constant
     */
    LUCA                       : [{
        /**
         * {Uint8Array} Code of first organism - LUCA (Last Universal Common Ancestor)
         */
        code: Uint8Array.from([
            CODE_OFFS + 2,  // nop
            CODE_OFFS + 2,  // nop
            CODE_OFFS + 2,  // nop
            CODE_OFFS + 21, // func
            127,            //   127
            CODE_OFFS + 19, //   loop
            CODE_OFFS + 54, //     mol
            CODE_OFFS,      //     toggle
            CODE_OFFS + 4,  //     sub
            CODE_OFFS + 7,  //     inc
            CODE_OFFS,      //     toggle
            CODE_OFFS + 36, //     load
            CODE_OFFS + 17, //     ife
            CODE_OFFS + 34, //       right
            CODE_OFFS + 54, //       mol
            CODE_OFFS + 38, //       cmp
            CODE_OFFS + 33, //       left
            CODE_OFFS,      //       toggle
            CODE_OFFS + 24, //       retax
            CODE_OFFS + 12, //       ifp
            CODE_OFFS,      //         toggle
            CODE_OFFS + 25, //         axret
            CODE_OFFS + 22, //         ret
            CODE_OFFS + 23, //       end
            CODE_OFFS + 23, //     end
            CODE_OFFS + 56, //     rmol
            CODE_OFFS + 24, //     retax
            CODE_OFFS + 13, //     ifn
            0,              //       0
            CODE_OFFS + 8,  //       dec
            CODE_OFFS + 25, //       axret
            CODE_OFFS + 22, //       ret 
            CODE_OFFS + 23, //     end
            CODE_OFFS + 23, //   end
            CODE_OFFS + 23, // end
            CODE_OFFS + 21, // func
            127,            //   127
            CODE_OFFS + 19, //   loop
            CODE_OFFS + 54, //     mol
            CODE_OFFS,      //     toggle
            CODE_OFFS + 56, //     rmol
            CODE_OFFS + 24, //     retax
            CODE_OFFS + 13, //     ifn
            CODE_OFFS,      //       toggle
            CODE_OFFS + 22, //       ret
            CODE_OFFS + 23, //     end
            CODE_OFFS + 23, //   end
            0,              //   0
            CODE_OFFS + 8,  //   dec
            CODE_OFFS + 25, //   axret
            CODE_OFFS + 23, // end
            CODE_OFFS + 21, // func
            3,              //   3
            CODE_OFFS + 35, //   save
            CODE_OFFS + 34, //   right
            127,            //   127
            CODE_OFFS,      //   toggle
            3,              //   3
            CODE_OFFS + 3,  //   add
            CODE_OFFS + 35, //   save
            CODE_OFFS + 34, //   right
            CODE_OFFS + 35, //   save
            CODE_OFFS + 34, //   right
            CODE_OFFS + 35, //   save
            CODE_OFFS + 34, //   right
            CODE_OFFS + 33, //   left
            CODE_OFFS + 33, //   left
            CODE_OFFS + 33, //   left
            0,              //   0
            CODE_OFFS + 55, //   smol
            CODE_OFFS + 20, //   call
            CODE_OFFS + 24, //   retax
            CODE_OFFS + 13, //   ifn
            CODE_OFFS + 22, //     ret
            CODE_OFFS + 23, //   end
            CODE_OFFS + 33, //   left
            CODE_OFFS + 56, //   rmol
            CODE_OFFS + 54, //   mol
            CODE_OFFS + 35, //   save
            CODE_OFFS + 34, //   right
            0,              //   0
            CODE_OFFS + 20, //   call
            CODE_OFFS + 24, //   retax
            CODE_OFFS + 13, //   ifn
            CODE_OFFS + 22, //     ret
            CODE_OFFS + 23, //   end
            CODE_OFFS + 56, //   rmol
            CODE_OFFS + 54, //   mol
            CODE_OFFS + 35, //   save
            CODE_OFFS + 34, //   right
            1,              //   1
            CODE_OFFS + 20, //   call
            CODE_OFFS + 35, //   save
            CODE_OFFS + 33, //   left
            CODE_OFFS + 33, //   left
            CODE_OFFS + 36, //   load
            CODE_OFFS + 55, //   smol
            127,            //   127
            CODE_OFFS + 19, //   loop
            CODE_OFFS + 34, //     right
            CODE_OFFS + 34, //     right
            CODE_OFFS + 34, //     right
            CODE_OFFS + 58, //     cmol
            CODE_OFFS + 33, //     left
            CODE_OFFS + 33, //     left
            CODE_OFFS + 36, //     load
            CODE_OFFS + 55, //     smol
            CODE_OFFS + 34, //     right
            CODE_OFFS + 34, //     right
            127,            //     127
            CODE_OFFS + 19, //     loop
            CODE_OFFS + 54, //       mol
            CODE_OFFS,      //       toggle
            CODE_OFFS + 38, //       cmp
            CODE_OFFS + 24, //       retax
            CODE_OFFS + 12, //       ifp
            CODE_OFFS + 33, //         left
            CODE_OFFS + 36, //         load
            CODE_OFFS + 55, //         smol
            CODE_OFFS,      //         toggle
            CODE_OFFS + 53, //         move
            CODE_OFFS + 33, //         left
            CODE_OFFS + 33, //         left
            CODE_OFFS + 36, //         load
            CODE_OFFS + 55, //         smol
            CODE_OFFS + 34, //         right
            CODE_OFFS + 34, //         right
            CODE_OFFS + 36, //         load
            CODE_OFFS + 8,  //         dec
            CODE_OFFS + 35, //         save
            CODE_OFFS + 33, //         left
            CODE_OFFS + 33, //         left
            CODE_OFFS + 39, //         break
            CODE_OFFS + 23, //       end
            CODE_OFFS + 56, //       rmol
            CODE_OFFS + 23, //     end
            CODE_OFFS + 56, //     rmol
            CODE_OFFS + 23, //   end
            CODE_OFFS + 23, // end
            2,              // 2
            CODE_OFFS + 20, // call
            CODE_OFFS + 2,  // nop
            CODE_OFFS + 2,  // nop
            CODE_OFFS + 2   // nop
        ])
        /**
         * {Number} absolute world offset of organism. If undefined, then will be 
         * generated automatically
         */
        // offs: 0
        /**
         * {Number} Start amount of evergy. If undefined, then will be generated automatically
         */
        // energy: 1000
    }],
    codeLinesPerIteration      : 10,
    codeRepeatsPerRun          : 20,
    codeMutateEveryClone       : 10,
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
     * {String} This query is used to put canvas with world in it
     */
    WORLD_CANVAS_QUERY         : '#world',
    /**
     * {Boolean} Show top-left buttons (fulscreen and visualize)
     */
    worldCanvasButtons         : true,
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
     * @constant
     */
    ORG_MIN_COLOR              : 0x96,
    orgColor                   : 0xFF0000,
    orgAmount                  : 1,
    orgMaxAge                  : 5000000,
    orgMutationPercent         : .01,
    orgMutationPeriod          : 1200001,
    orgMaxCodeSize             : 2048,
    orgMaxMemSize              : 64,
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
    molAmount                  : 200000,
    molCodeSize                : 3,
    molRandomAtomPercent       : .3,
    molColor                   : 0xff0000,
    /**
     * {Number} Energy related configuration
     */
    energyStepCoef             : .015,
    energyMultiplier           : 10000,
    /**
     * Plugins. Extends irma core by additional functionality
     * @constant
     */
    PLUGINS                    : ['Decay', 'Status']
};