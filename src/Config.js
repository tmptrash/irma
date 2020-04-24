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
const WIDTH       = 1920 * 2;
const HEIGHT      = 1080 * 2;
const CODE_OFFS   = 128 - 64;
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
    NAND    : CODE_OFFS + 24,
    AGE     : CODE_OFFS + 25,
    LINE    : CODE_OFFS + 26,
    LEN     : CODE_OFFS + 27,
    LEFT    : CODE_OFFS + 28,
    RIGHT   : CODE_OFFS + 29,
    SAVE    : CODE_OFFS + 30,
    LOAD    : CODE_OFFS + 31,
    READ    : CODE_OFFS + 32,
    BREAK   : CODE_OFFS + 33,
    CONTINUE: CODE_OFFS + 34,
    //
    // Biological stuff
    //
    JOIN    : CODE_OFFS + 35,
    SPLIT   : CODE_OFFS + 36,
    STEP    : CODE_OFFS + 37,
    SEE     : CODE_OFFS + 38,
    SAY     : CODE_OFFS + 39,
    LISTEN  : CODE_OFFS + 40,
    NREAD   : CODE_OFFS + 41,
    GET     : CODE_OFFS + 42,
    PUT     : CODE_OFFS + 43,
    OFFS    : CODE_OFFS + 44,
    COLOR   : CODE_OFFS + 45,
    ANAB    : CODE_OFFS + 46,
    CATAB   : CODE_OFFS + 47,
    MOL     : CODE_OFFS + 48,
    MMOL    : CODE_OFFS + 49,
    SMOL    : CODE_OFFS + 50,
    RMOL    : CODE_OFFS + 51,
    LMOL    : CODE_OFFS + 52,
    CMOL    : CODE_OFFS + 53,
    MCMP    : CODE_OFFS + 54,
    ASM     : CODE_OFFS + 55,
    REAX    : CODE_OFFS + 56,
    DIR     : CODE_OFFS + 57,
    LHEAD   : CODE_OFFS + 58,
    RHEAD   : CODE_OFFS + 59
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
    DIRS                       : new Int32Array([-WIDTH, -WIDTH + 1, 1, WIDTH + 1, WIDTH, WIDTH - 1, -1, -WIDTH - 1]),
    /**
     * {Array} Opposite array of directions
     */
    UNDIRS                     : {[-WIDTH]: 'u' , [-WIDTH + 1]: 'ur', 1: 'r', [WIDTH + 1]: 'rd', [WIDTH]: 'd', [WIDTH - 1]: 'ld', [-1]: 'l', [-WIDTH - 1]: 'lu'},
    /**
     * {String} Line comment symbol
     */
    CODE_COMMENT_STR           : '#',
    /**
     * {String} Annotation for last atom in a molecule. Should be before comment
     */
    CODE_MOL_STR               : '@mol',
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
    CODE_STACK_SIZE            : 64,
    CODE_RE_OK                 : 1,
    CODE_RE_ERR                : 0,
    CODE_RE_SPECIAL            : -1,
    CODE_ORG_ID                : 17,
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
    LUCAS                      : [{
        /**
         * {Uint8Array} Code of first organism - LUCA (Last Universal Common Ancestor)
         */
        code: `
        #
        # LUCA v6
        # This is Last Universal Common Ancestor - first leaving 
        # replicator in irma simulation. He is written by developer.
        # He may eat, move around the world randomly, make his clone
        # and gather energy by doing catabolism. He uses three heads
        # to do clone:
        #   h0 - current clonning molecule
        #   h1 - cur clone mol
        #   h2 - food
        #
        # @author flatline
        #
        #
        # Reset 0 head
        #
        #
        # Splits wastes or clonning. Search for empty space near
        #
        func                          # func0
          63
          loop
            split
            reax
            ifp              @mol
              break
            end
            8
            rand
            dir
            step             @mol
          end
        end
        0
        smol                          # h0=cur mol
        #
        # Sets heads 1,2 to the end
        #
        rhead                         # h1=cur clone mol
        len                  @mol
        smol
        rhead                         # h2=food
        smol
        #
        # Global big loop
        #
        20
        toggle
        eq                   @mol
        lshift                        # ax=20971520
        loop
          #
          # 10 random steps & eat
          #
          10
          loop
            rand
            dir              @mol
            step
            join
            len
            smol                      # h2=food
            #
            # Get energy by catabolism
            #
            reax
            ifp              @mol
              0
              catab
              len
              smol
            end
            #
            # Organism is full
            #
            ifn              @mol
              #
              # Search for empty place to split
              #
              lhead                   # h1
              0
              call
              rhead                   # h2
            end
          end                @mol
          #
          # Do one step of clonning
          #
          lhead                       # h1=cur clone mol
          mol                         # ax=cur clone mol
          lhead                       # h0=cur mol
          asm
          reax
          ifp                @mol
            #
            # Last atom - nop means we have to split clonned org
            #
            1
            toggle
            33
            lshift                    # ax=66 - nop
            save                      # m0=66 - nop
            mol              @mol
            read
            toggle
            load
            ife
              rmol                    # h0++
              rhead          @mol     # h1=cur clone mol
              rmol
              17
              save
              lhead                   # h0=cur mol
              #
              # Search for empty place to split
              #
              0
              call           @mol
              #
              # Cut wastes
              #
              rhead                   # h1
              len
              smol
              lhead                   # h0
              50
              save           @mol     # resets unique clone id (17)
              #
              # Search for empty place to split
              #
              0
              call
              ret
            end
            rmol                      # h0++
            rhead            @mol     # h1=cur clone mol
            rmol
            lhead                     # h0=cur mol
          end
          rhead
          rhead                       # h2=food
        end                  @mol
        nop
        nop
        nop
        nop
        nop
        ret                  @mol
        `,
        /**
         * {Number} absolute world offset of organism. If undefined, then will be 
         * generated automatically
         */
        offs: Math.round(WIDTH * HEIGHT / 2 + WIDTH / 2),
        /**
         * {Number} Start amount of evergy. If undefined, then will be generated automatically
         */
        energy: 6000 * 1024 + (6000 * 1024) / 3 // 6000 sec * 1024 commands + 30%
    }],
    codeLinesPerIteration      : 3,
    codeRepeatsPerRun          : 20,
    codeMutateEveryClone       : 2,
    codeMutateMutations        : false,

    /**
     * {Boolean} Turns on or off panzoom library
     */
    WORLD_USE_ZOOM             : true,
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
    WORLD_CANVAS_WIDTH         : WIDTH / 8,
    WORLD_CANVAS_HEIGHT        : HEIGHT / 8,
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
    worldFrequency             : 1024,
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
    ORG_MAX_MEM_SIZE           : 32,
    orgColor                   : 0xFF0000,
    orgMaxAge                  : 0,
    orgMutationPercent         : .01,
    orgMutationPeriod          : 1000000,
    ORG_MAX_CODE_SIZE          : 1024,
    /**
     * {Array} change,del,period,amount,probs,insert,copy,cut 
     * Is used for new created organisms. During cloning, all
     * organism properties will be inherited.
     */
    orgProbs                   : Uint8Array.from([10,1,2,1,1,1]),
    /**
     * Molecules related configs
     */
    molSunPeriod               : 1,
    molAmount                  : WIDTH * HEIGHT * .1, // 10% of molecules
    molCodeSize                : 6,
    molRandomAtomPercent       : .4,
    molColor                   : 0xff0000,
    /**
     * {Number} Energy related configuration
     */
    energyStepCoef             : .002,
    energyMetabolismCoef       : 10,
    energyCommand              : .01,
    /**
     * {Number} This value will be used for every LUCA on system start if
     * there is no property "energy" in LUCAS config was specified
     */
    energyOrg                  : 600000,
    /**
     * Plugins. Extends irma core by additional functionality
     * @constant
     */
    PLUGINS                    : ['Sun', 'Status']
};