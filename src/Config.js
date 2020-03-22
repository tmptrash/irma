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
const WIDTH       = 1920 * 4;
const HEIGHT      = 1080 * 4;
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
    SAVEA   : CODE_OFFS + 32,
    LOADA   : CODE_OFFS + 33,
    READ    : CODE_OFFS + 34,
    BREAK   : CODE_OFFS + 35,
    //
    // Biological stuff
    //
    JOIN    : CODE_OFFS + 36,
    SPLIT   : CODE_OFFS + 37,
    STEP    : CODE_OFFS + 38,
    SEE     : CODE_OFFS + 39,
    SAY     : CODE_OFFS + 40,
    LISTEN  : CODE_OFFS + 41,
    NREAD   : CODE_OFFS + 42,
    GET     : CODE_OFFS + 43,
    PUT     : CODE_OFFS + 44,
    OFFS    : CODE_OFFS + 45,
    COLOR   : CODE_OFFS + 46,
    ANAB    : CODE_OFFS + 47,
    CATAB   : CODE_OFFS + 48,
    MOL     : CODE_OFFS + 49,
    MMOL    : CODE_OFFS + 50,
    SMOL    : CODE_OFFS + 51,
    RMOL    : CODE_OFFS + 52,
    LMOL    : CODE_OFFS + 53,
    CMOL    : CODE_OFFS + 54,
    MCMP    : CODE_OFFS + 55,
    FIND    : CODE_OFFS + 56,
    REAX    : CODE_OFFS + 57,
    DIR     : CODE_OFFS + 58,
    LHEAD   : CODE_OFFS + 59,
    RHEAD   : CODE_OFFS + 60
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
        # In:
        #   m0    - back direction
        #   m1    - anabolism regime (1|0)
        # Out:
        #   ax    - 1 - success
        #           0 - fail
        #
        # func0. Cuts the tail
        #
        func
          load                        # ax=back dir
          dir
          len
          rhead
          split                @mol   # bx=back dir
          lhead
          reax
        end
        #
        # Checks ate molecule and cut first atom if needed.
        # Turns off anabolism regime if last atom found.
        # Stores index of current atom in m2
        # In: 
        #   mPos - 1
        #   head - 0 
        #
        func
          right                       # m2
          #
          # Loads first atom from ate molecule
          #
          rhead                @mol   # h1
          mol
          read
          toggle                      # bx=ate first atom
          #
          # Loads index of current atom of needed molecule
          #
          load
          read                        # ax=cur atom
          #
          # Returns memory pos
          #
          left                 @mol   # m1
          #
          # Compares two atoms
          #
          ife
            #
            # Splits first atom and cut other
            #
            0
            catab
            rmol
          left                      # m0
          #
          # Resets head position
          #
            lhead              @mol   # h0
            call
            #
            # Updates cur atom index
            #
            right                     # m1
            right                     # m2
            load
            inc                       # ax=cur atom index
            save               @mol
            #
            # Checks if it's last atom
            #
            mol                       # bx=last atom idx
            load                      # ax=cur atom idx
            ifg
              #
              # Joins all atoms together
              #
              mol
              toggle
              sub              @mol
              inc                     # ax=mol len
              toggle                  # bx=mol len
              len
              toggle                  # ax=mol len
              dec
              loop             @mol
                toggle                # ax=cur atom
                dec
                toggle
              end
              left
              0                @mol
              save
              right
            end
          rhead                     # h1
          left                      # m1
          end                  @mol
          lhead                       # h0
        end
        #
        # Sets head0 to the beginnig of replicator
        #
        0
        smol
        #
        # Create big loop
        #
        20
        toggle                 @mol
        eq
        lshift                        # ax=20971520
        loop
          #
          # Step any direction, eat and checks if needed mol
          #
          8
          rand
          dir                  @mol
          step
          #
          # Store back dir in m0
          #
          toggle                      # bx=dir
          4
          add                         # ax=back dir
          save                        # m0=back dir
          #
          # We should have free space behind for wastes
          #
          reax                 @mol
          ifp
            eq                        # ax=dir
            join
            reax                      # ax=ate mol len
            ifp                       # ate something
              right            @mol   # m1
              #
              # Checks anabolism regime
              #
              load
              ifp
                1
                call
              end
              #
              # Checks cur mol len
              #
              mol              @mol   # h0
              toggle                  # ax=molIdx1  bx=molIdx0
              sub
              inc                     # ax=cur mol len
              save                    # m1=cur mol len
              #
              # Sets head1 to ate molecule
              #
              reax                    # ax=ate mol len
              toggle           @mol   # bx=ate mol len
              len
              sub                     # ax=ate mol idx
              rhead                   # h1
              smol
              lhead
              #
              # Loads cur mol len into ax
              #
              load             @mol
              left                    # m0
              toggle                  # bx=cur mol len
              reax                    # ax=ate mol len
              #
              # Wrong length. Cut it
              #
              ifne
                #
                # Try to get energy by catabolism
                #
                0
                rhead          @mol
                catab
                lhead
                #
                # Cut bad molecules
                #
                call
                ifz
                  break
                end            @mol
              end
              #
              # Correct len. Check if needed
              #
              ife
                #
                # Compares current mol and eated
                #
                mcmp
                reax
                ifz
                  #
                  # Try to get energy by catabolism on every 10th molecule
                  #
                  10           @mol
                  rand
                  ifz
                    rhead
                    catab
                    lhead
                  end          @mol
                  #
                  # wrong mol, cut it
                  #
                  0
                  call
                  ifz
                    break
                  end
                  #
                  # Try to assemble needed molecule with anabolism
                  #
                  10           @mol
                  rand
                  toggle
                  3
                  #
                  # In 20% of cases sets anabolism regime
                  #
                  ifg
                    right
                    1          @mol
                    save
                    left
                    # check ax here to break the loop
                  end
                  0
                end
                #
                # Needed mol, just leave it
                #
                ifp            @mol   # needed mol
                  #
                  # Checks if this is the end (last replicator mol)
                  #
                  1
                  toggle
                  33
                  lshift                # ax=66 - nop
                  right                 # m1
                  save         @mol     # m1=66 - nop
                  mol
                  read
                  toggle                # bx=first atom
                  load
                  left                  # m0
                  ife          @mol
                    #
                    # Loads back dir from m0
                    #
                    load
                    toggle              # bx=back dir
                    17
                    save
                    break
                  end          @mol
                  #
                  # Move h0 to the next mol
                  #
                  rmol
                end
              end
            end
          end
        end                    @mol
        # TODO: i'm here!!!!
        # Cut wastes. The code below is not random. The reason behind
        # it, that nop atom should be the first atom in a last molecule.
        # Any other molecule must not have it on the beginning
        #
        63
        #
        # We have to try cut wastes many times in different places
        #
        loop
          8
          rand
          dir
          step                 @mol
          line
          line
          smol
          rmol
          rmol
          rmol                 @mol
          reax
          ifn
            break
          end
          len
          split                @mol
          nop                         # separator. must be first atom of last mol
          reax
          ifp
            break
          end
        end                    @mol
        #
        # Food section
        #
        `,
        /**
         * {Number} absolute world offset of organism. If undefined, then will be 
         * generated automatically
         */
        // offs: 0
        /**
         * {Number} Start amount of evergy. If undefined, then will be generated automatically
         */
        energy: 6000 * 1000 + (6000 * 1000) / 3 // 6000 sec * 1000 commands + 30%
    }],
    codeLinesPerIteration      : 3,
    codeRepeatsPerRun          : 20,
    codeMutateEveryClone       : 10,
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
    WORLD_CANVAS_WIDTH         : WIDTH / 4,
    WORLD_CANVAS_HEIGHT        : HEIGHT / 4,
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
    ORG_MAX_MEM_SIZE           : 32,
    orgColor                   : 0xFF0000,
    orgMaxAge                  : 5000000,
    orgMutationPercent         : .01,
    orgMutationPeriod          : 0, // 3000000,
    orgMaxCodeSize             : 1024,
    /**
     * {Array} change,del,period,amount,probs,insert,copy,cut 
     * Is used for new created organisms. During cloning, all
     * organism properties will be inherited.
     */
    orgProbs                   : Uint8Array.from([10,1,1,1,1,1,1,1,3]),
    /**
     * Molecules related configs
     */
    molDecayPeriod             : 1,
    molDecayDistance           : 60,
    molAmount                  : WIDTH * HEIGHT * .3, // 30% of molecules
    molCodeSize                : 5,
    molRandomAtomPercent       : .4,
    molColor                   : 0xff0000,
    /**
     * {Number} Energy related configuration
     */
    energyStepCoef             : .015,
    energyMove                 : 3,
    energyMetabolismCoef       : 100,
    /**
     * {Number} This value will be used for every LUCA on system start if
     * there is no property "energy" in LUCAS config was specified
     */
    energyOrg                  : 600000,
    /**
     * Plugins. Extends irma core by additional functionality
     * @constant
     */
    PLUGINS                    : [/* 'Decay', */ 'Status']
};