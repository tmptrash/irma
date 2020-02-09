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
const WIDTH       = 1920 /4;
const HEIGHT      = 1080 / 4;
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
    W2MOL   : CODE_OFFS + 56,
    MOL2W   : CODE_OFFS + 57,
    FIND    : CODE_OFFS + 58,
    REAX    : CODE_OFFS + 59
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
     * {String} Line comment symbol
     */
    CODE_COMMENT_SYMBOL        : '#',
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
        # This file contains LUCA - Last Universal Common Ancestor code.
        # It's a code of one digital organism for irma simulation. The 
        # whole virtual world starts from this one organism. The meaning
        # of this code is to:
        # - find needed molecules in outside world and eat them
        # - obtain energy from some found molecules
        # - assemble self copy from found molecules
        # - excrete unneeded molecules into the world
        # We also should use @mol annotation to split code into molecules. 
        # Here is the general structure of one organism's code:
        #
        #  sep    repl                 sep  food               repl copy
        # [66,66, 1,0,1,1,0,2,1,2,1, 66,66, 1,2,1,0,0,2,1,0,1, 1,3,2,1,1,2]
        #         mol                       mol                write
        #
        # It consists of 5 parts: separators, replicator, food and it's copy.
        # Simulation starts only with first three parts. Food and replopy 
        # will be appended later during lifetime.
        #
        # Where:
        # - sep   - separator molecule
        # - repl  - replicator code
        # - food  - food section (molecules found in a world)
        # - copy  - self copy in a tail
        # - mol   - molecule head (pointer to molecule)
        # - write - write head (pointer to write position (molecule))
        #
        # We use some shortcuts in a code below:
        # - m0..mX   - Memory positions (indexes)
        # - @mol     - Last atom in a molecule (marker between molecules)
        # - ax,bx,re - registers
        # - mol      - Molecule
        # - sep      - Molecule-separator (nop,nop,nop)
        #
        # This is molecule-separator. The same one at the end of
        # replicator code. This is how we distinguish replicator code 
        # and food section. This separator shold be copied into child
        # organism as well
        #
        nop
        nop
        nop               @mol
        #
        # desc: Search for molecule in a code and returns it's index or -1.
        #       Parent code should set search limit (or end index), search 
        #       molecule in a memory and set mol head into start search index
        # in  : m0     - search limit index
        # in  : m1..mX - search molecule
        # in  : mol    - search start index
        # out : ax     - idx|-1
        #
        func                    # func0
          #
          # This is just big number to make loop longer
          # then amount of molecules insize the organism
          #
          63
          lshift          @mol
          lshift                # 252 molecules/iterations
          loop
            right         @mol  # m1
            mcmp                # re=0|1
            reax                # ax=0|1
            #
            # Molecule found. Return index in ax
            #
            ifp           @mol
              mol               # ax=mol
              ret
            end           @mol
            rmol
            reax
            ifn           @mol
              0
              dec
              ret         @mol
            end
            #
            # Checks search limit
            #
            mol
            inc           @mol  # ax=start+1
            toggle              # ax=end       bx=start+1
            left                # m0
            load          @mol  # ax=limit     bx=start+1
            ifl
              0
              dec         @mol
              ret
            end
          end             @mol
        end
        #
        # desc: Try to use catabolism and anabolism to assemble
        #       needed molecule
        # in  : m0  - start search index
        #     : m1  - end search index
        #     : mol - molecule to search
        # out : ax  - molecule index|-1
        func                    # func1
          #
          # Sets start and end search indexes
          #
          load            @mol  # ax=start
          right                 # m3
          toggle
          load            @mol  # ax=end       bx=start
          toggle                # ax=start     bx=end
          find
          right           @mol  # m4
          save                  # m2=idx-1
          toggle
          reax            @mol
          ifn
            left                # m3
            left                # m2
            ret
          end             @mol
          toggle                # ax=idx
          #
          # Separate previous molecule and new one
          #
          dec
          toggle          @mol  # bx=idx-1
          0
          dec                   # ax=-1        bx=idx-1
          catab           @mol
          #
          # Gets molecule len
          #
          mol
          toggle
          sub             @mol
          inc
          toggle                # bx=molLen
          #
          # Separate next and current molecules
          #
          load            @mol  # ax=molIdx-1
          add                   # ax=molEndIdx
          toggle                # bx=molEndIdx+1
          0               @mol
          dec                   # ax-1         bx=molEndIdx+1
          catab
          #
          # Joins near molecules if needed until we 
          # obtain molecule, which we search
          #
          load            @mol  # ax=molIdx
          toggle
          dec
          toggle          @mol
          savea                 # m4=molIdx    m5=molEndIdx
          smol
          #
          # Updates write head position
          #
          0               @mol
          smol
          lmol
          w2mol           @mol
          #
          # Sets mol head to current molecule
          #
          load
          smol
          right           @mol
          #
          # Join molecules
          #
          10
          loop
            mol           @mol
            load                # ax=molEnd1   bx=molEnd2
            ife
              break       @mol
            end
            0
            dec           @mol
            anab
          end
          left
          left
          left
        end               @mol
        #
        # desc: Try to make clone getting molecules form
        #       food section and move them in a same way 
        #       like in replicator section
        # in  : nothing
        # info: m-1  - food section start
        #       m0   - i (current repl molecule)
        #       m1   - food section end
        #       m2.. - molecule
        #
        func                    # func2
          #
          # 1. Finds second separator molecule
          #
          # 1.1. Sets write head to the last molecule.
          #
          0
          smol            @mol
          lmol
          w2mol
          #
          # 1.2. Prepares to call func0, to find second 
          # separator sets search limit to m0. Search limit
          # is a last molecule
          #
          mol             @mol  # ax=last molecule
          save                  # m0=last molecule
          #
          # 1.3. Sets 0 molecule as separator
          #
          right                 # m1
          0               @mol
          smol
          cmol                  # m1-m3[nop,nop,nop]
          rmol            @mol
          left                  # m0
          call                  # ax=sep1Idx
          ifn             @mol
            ret
          end
          toggle          @mol  # bx=sep1Idx
          #
          # 2. Sets data to memory:
          #    m0 - i
          #    m1 - food segment start
          #    m2 - food segment end
          #    m3 - cur molecule
          #
          left                  # m0
          0
          smol            @mol
          save                  # m0=i
          #
          # 2.1. m1 - food segment start
          #
          toggle                # ax=sep1Idx
          smol            @mol
          rmol
          reax
          ifn             @mol
            ret
          end
          mol             @mol
          right                 # m1
          save                  # m1=foodStart
          #
          # 2.2. m2 - food segment end
          #
          mol2w           @mol
          mol
          right                 # m2
          save            @mol  # m2=foodEnd
          #
          # 3. Here starts main loop, where organism
          # walk through it's replicator section and
          # search for it's molecules in food section.
          # m0 stores current replicator molecule index
          #
          # 3.1. Sets mol head to first repl molecule
          #
          left                  # m1
          left                  # m0
          load            @mol
          smol
          right
          right           @mol
          right                 # m3
          #
          # 3.2 Sets big number for loop
          #
          63
          lshift          @mol
          lshift
          loop
            #
            # 3.3. copy current replicator molecule to m3...mX,
            # sets search limit and call search function
            #
            cmol          @mol  # m3[nop,nop,nop]
            left                # m2
            left                # m1=foodStart
            load          @mol
            smol
            right               # m2
            0             @mol
            call                # ax=molIdx
            ifn
              left        @mol  # m1
              left              # m0
              load
              smol        @mol  # mol=molIdx
              right             # m1
              1
              call        @mol
              ifn
                #
                # We have to cut food section, because it's
                # impossible to assemble a copy
                #
                load            # ax=foodStart
                smol      @mol
                len
                split
              end         @mol
              ret
            end
            #
            # 3.4. Move found molecule to write head
            #
            mmol          @mol
            #
            # 3.5. Updates limit value (memory)
            #
            left                # m2=foodEnd
            load
            smol          @mol
            lmol
            mol
            save          @mol  # m2=foodEnd-1
            #
            # 3.6. Updates food segment end
            #
            0
            smol
            lmol          @mol
            w2mol
            #
            # 3.6. Updates i
            #
            left                # m1
            left          @mol  # m0
            load
            smol
            rmol          @mol
            mol
            save                # m0=i++
            #
            # 3.7. checks if copy has done
            #
            toggle        @mol  # bx=i
            right               # m1=foodStart
            load                # ax=foodStart bx=i
            ife           @mol
              break
            end
            #
            # 3.8. Sets mem back to m3
            #
            right         @mol  # m2
            right               # m3
          end
          #
          # 6. cut the tail with copied organism
          #
          17              @mol
          save
          len
          split           @mol
        end
        #
        # Try to make clone with all complicated stuff
        # inside like anabolism, catabolism molecules 
        # search in food section and so on...
        # 
        2
        call              @mol
        #
        # Random walk and eating
        #
        5
        toggle                  # bx=5
        30                @mol
        loop
          8
          rand            @mol
          step
          join
          #
          # Half of molecules should be used for getting energy
          # or catabolism
          #
          ifl             @mol  # ax=rnd       bx=5
            reax
            ifp
              #
              # Obtain energy using catabolism
              #
              0           @mol
              smol
              lmol
              catab       @mol
              #
              # Cut this molecule to outside world
              #
              len
              split
            end           @mol
          end
        end
        #
        # This command should be last before final 
        # molecule-separator to do the infinite loop
        # of replicator code
        #
        ret               @mol
        nop
        nop
        nop               @mol
        #
        # here is test food section. This part---------------------
        # should be removed after tests----------------------------
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
        energy: 600 * 1000 // 600 sec * 1000 commands
    }],
    codeLinesPerIteration      : 10,
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
    ORG_MAX_MEM_SIZE           : 32,
    orgColor                   : 0xFF0000,
    orgMaxAge                  : 5000000,
    orgMutationPercent         : .01,
    orgMutationPeriod          : 1200001,
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
    molAmount                  : 120000,
    molCodeSize                : 3,
    molRandomAtomPercent       : .3,
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