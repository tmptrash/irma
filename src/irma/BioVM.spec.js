/* eslint-disable global-require */
describe('src/irma/VM', () => {
    const Config     = require('./../Config');
    const oldConfig  = JSON.parse(JSON.stringify(Config)); // Config copy
    const WIDTH      = 10;
    const HEIGHT     = 10;
    const RE_OK      = Config.CODE_RE_OK;
    const RE_ERR     = Config.CODE_RE_ERR;
    const RE_SPECIAL = Config.CODE_RE_SPECIAL;
    //
    // This call should be before require('./VM') to setup our 
    // configuration instead of default
    // eslint-disable-next-line no-use-before-define
    _setConfig();
    const BioVM      = require('./BioVM');
    const Compiler   = require('./Compiler');

    const M         = Config.CODE_8_BIT_MASK;
    
    const TG        = Config.CODE_CMDS.TOGGLE;
    const EQ        = Config.CODE_CMDS.EQ;
    const NO        = Config.CODE_CMDS.NOP;
    const AD        = Config.CODE_CMDS.ADD;
    const SU        = Config.CODE_CMDS.SUB;
    const MU        = Config.CODE_CMDS.MUL;
    const DI        = Config.CODE_CMDS.DIV;
    const IN        = Config.CODE_CMDS.INC;
    const DE        = Config.CODE_CMDS.DEC;
    const RS        = Config.CODE_CMDS.RSHIFT;
    const LS        = Config.CODE_CMDS.LSHIFT;
    const RA        = Config.CODE_CMDS.RAND;
    const FP        = Config.CODE_CMDS.IFP;
    const FN        = Config.CODE_CMDS.IFN;
    const FZ        = Config.CODE_CMDS.IFZ;
    const FG        = Config.CODE_CMDS.IFG;
    const FL        = Config.CODE_CMDS.IFL;
    const FE        = Config.CODE_CMDS.IFE;
    const FNE       = Config.CODE_CMDS.IFNE;
    const LP        = Config.CODE_CMDS.LOOP;
    const CA        = Config.CODE_CMDS.CALL;
    const FU        = Config.CODE_CMDS.FUNC;
    const RE        = Config.CODE_CMDS.RET;
    const EN        = Config.CODE_CMDS.END;
    const NA        = Config.CODE_CMDS.NAND;
    const AG        = Config.CODE_CMDS.AGE;
    const LI        = Config.CODE_CMDS.LINE;
    const LE        = Config.CODE_CMDS.LEN;
    const LF        = Config.CODE_CMDS.LEFT;
    const RI        = Config.CODE_CMDS.RIGHT;
    const SA        = Config.CODE_CMDS.SAVE;
    const LO        = Config.CODE_CMDS.LOAD;
    const RD        = Config.CODE_CMDS.READ;
    const BR        = Config.CODE_CMDS.BREAK;

    const JO         = Config.CODE_CMDS.JOIN;
    const SP         = Config.CODE_CMDS.SPLIT;
    const ST         = Config.CODE_CMDS.STEP;
    const SE         = Config.CODE_CMDS.SEE;
    const SY         = Config.CODE_CMDS.SAY;
    const LN         = Config.CODE_CMDS.LISTEN;
    const NR         = Config.CODE_CMDS.NREAD;
    const GE         = Config.CODE_CMDS.GET;
    const PU         = Config.CODE_CMDS.PUT;
    const OF         = Config.CODE_CMDS.OFFS;
    const CO         = Config.CODE_CMDS.COLOR;
    const AN         = Config.CODE_CMDS.ANAB;
    const CT         = Config.CODE_CMDS.CATAB;
    const MM         = Config.CODE_CMDS.MMOL;
    const MO         = Config.CODE_CMDS.MOL;
    const SM         = Config.CODE_CMDS.SMOL;
    const RM         = Config.CODE_CMDS.RMOL;
    const LM         = Config.CODE_CMDS.LMOL;
    const CM         = Config.CODE_CMDS.CMOL;
    const MC         = Config.CODE_CMDS.MCMP;
    const AS         = Config.CODE_CMDS.ASM;
    const DR         = Config.CODE_CMDS.DIR;
    const LH         = Config.CODE_CMDS.LHEAD;
    const RH         = Config.CODE_CMDS.RHEAD;

    let   vm         = null;

    /**
     * Setup default config for tests
     */
    function _setConfig() {
        Object.assign(Config, {
            // constants
            DIRS                       : new Int32Array([-WIDTH, -WIDTH + 1, 1, WIDTH + 1, WIDTH, WIDTH - 1, -1, -WIDTH - 1]),
            DB_ON                      : false,
            WORLD_WIDTH                : WIDTH,
            WORLD_HEIGHT               : HEIGHT,
            PLUGINS                    : [],
            // variables
            codeLinesPerIteration      : 1,
            codeRepeatsPerRun          : 1,
            codeMutateEveryClone       : 1000,
            codeMutateMutations        : false,
            LUCAS                      : [{code: '', offs: 0, energy: 600000}],
            worldZoomSpeed             : 0.1,
            worldFrequency             : 10,
            molAmount                  : 1,
            ORG_MAX_MEM_SIZE           : 32,
            orgMaxAge                  : 2000000,
            orgMutationPercent         : .02,
            orgMutationPeriod          : 2000001,
            orgMaxCodeSize             : 50,
            orgProbs                   : new Uint32Array([10,1,3,1,5,1,1]),
            molDecayPeriod             : 1000,
            molDecayDistance           : 60,
            molCodeSize                : 2,
            energyStepCoef             : 0.01,
            energyMetabolismCoef       : 10000
        });
    }

    /**
     * Runs one script from single organism and checks registers on finish
     * @param {Array} code Array of codes of organisms and molecules
     * @param {Object} cfg Test configuration
     * @param {Array} move Array of offsets of organisms and molecules
     */
    function run(code, cfg, move) {
        Config.codeLinesPerIteration = Math.max(...code.map(c => c.length));
        Object.assign(Config, {LUCAS: (new Array(code.length - cfg.molAmount).fill(0).map(() => {return {code: ''}}))});
        Object.assign(Config, cfg);
        vm  = new BioVM({animate: false});
        for (let i = 0; i < move.length; i++) {
            const org  = vm.orgsMols.get(i);
            org.code   = Uint8Array.from(code[i]);
            vm.world.empty(org.offset);
        }
        for (let i = 0; i < move.length; i++) {
            const org = vm.orgsMols.get(i);
            vm.world.dot(org.offset = move[i], (org.molIndex ? org.molIndex : org.index) + 1);
            org.hasOwnProperty('energy') && Compiler.compile(org);
        }

        expect(vm.orgs.items).toBe(Config.LUCAS.length);
        expect(vm.orgsMols.items).toBe(Config.molAmount + Config.LUCAS.length);
        vm.run();
    }

    /**
     * Runs one script from single organism and checks registers on finish
     * @param {Uint8Array} code Code to run
     * @param {Number} ax ax register should be equal this value after run
     * @param {Number} bx bx register should be equal this value after run
     * @param {Number} ret ret register should be equal this value after run
     * @param {Boolean} checkLen If true, then org.code.length === lines
     * @param {Number} lines Amount of lines run after calling vm.run()
     */
    function run2(code, ax = 0, bx = 0, ret = 0, checkLen = true, lines = null) {
        Config.molAmount = 0;
        Config.orgAmount = 1;
        Config.codeLinesPerIteration = lines === null ? code.length : lines;
        vm = new BioVM({animate: false});
        const org = vm.orgs.get(0);
        org.code  = Uint8Array.from(code).slice(); // code copy
        Compiler.compile(org);

        expect(org.ax).toBe(0);
        expect(org.bx).toBe(0);
        expect(org.re).toBe(RE_ERR);
        expect(org.line).toBe(0);
        vm.run();

        expect(org.ax).toBe(ax);
        expect(org.bx).toBe(bx);
        expect(org.re).toBe(ret);
        checkLen && expect(org.line).toEqual(org.code.length);
    }

    beforeEach(() => {
        _setConfig();
        const div = document.createElement('DIV');
        div.id = 'world';
        document.body.appendChild(div);
    });

    afterEach(() => {
        Object.assign(Config, oldConfig);
        vm && vm.destroy();
        vm = null;
        document.body.removeChild(document.body.querySelector('#world'));
    });

    describe('BioVM creation', () => {
        it('Checks BioVM creation', () => {
            vm = new BioVM({animate: false});
            const cfg   = Config;
            const bCode = Compiler.toByteCode(Config.LUCAS[0].code);

            expect(vm.orgs.size).toBe(Math.round(cfg.molAmount * cfg.molCodeSize / (bCode.length || 1)) + cfg.LUCAS.length + 1);
            expect(vm.orgsMols.size).toBe(cfg.molAmount + cfg.LUCAS.length + 2);
        });
        it('Checks BioVM creation with huge amount of molecules', () => {
            const cfg     = Config;
            cfg.molAmount = cfg.WORLD_HEIGHT * cfg.WORLD_WIDTH + 10;
            vm = new BioVM({animate: false});

            expect(vm.orgs.items).toBe(0);
        });
    });

    describe('Scripts run', () => {
        describe('join tests', () => {
            it('Checks joining right organism',  () => {
                run([[JO|M],[JO|M]], {molAmount: 0}, [1,0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([JO|M,JO|M]));
            });
            it('Checks joining right organism at the end of the code',  () => {
                run([[0|M],[1,JO|M]], {molAmount: 0}, [1,0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([1,JO|M,0|M]));
            });
            it('Checks joining right organism at the center of the code',  () => {
                run([[0|M],[1|M,2|M,RM,JO|M]], {molAmount: 0}, [1,0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([1|M,2|M,0|M,RM,JO|M]));
            });
            it('Checks joining right organism after first molecule in the code',  () => {
                run([[0|M],[1|M,JO|M]], {molAmount: 0}, [1,0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([1|M,0|M,JO|M]));
            });
            it('Checks joining empty cell on the right',  () => {
                run([[JO|M],[JO|M]], {molAmount: 0}, [0, 2]);

                expect(vm.orgs.items).toBe(2);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([JO|M]));
            });
            it('Checks joining molecule on the right',  () => {
                run([[JO|M],[JO|M]], {molAmount: 1, LUCAS: [{code: ''}]}, [0, 1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([JO|M,JO|M]));
            });
            it('Checks joining molecule on the right and script should work correct (line: left)',  () => {
                run([[1|M,JO|M,IN|M],[IN|M]], {molAmount: 1, LUCAS: [{code: ''}]}, [0, 1]);
                const org = vm.orgs.get(0);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(org.code).toEqual(Uint8Array.from([1|M,IN|M,JO|M,IN|M]));
                expect(org.ax).toBe(1);
                expect(org.bx).toBe(0);
            });
            it('Checks joining molecule on the right and script should work correct (line: right)',  () => {
                run([[JO,IN|M,IN|M],[IN|M]], {molAmount: 1, LUCAS: [{code: ''}]}, [0, 1]);
                const org = vm.orgs.get(0);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(org.code).toEqual(Uint8Array.from([JO,IN|M,IN|M,IN|M]));
                expect(org.ax).toBe(2);
                expect(org.bx).toBe(0);
            });
            it('Checks joining if organism is at the edge of the world',  () => {
                run([[JO|M]], {molAmount: 0}, [WIDTH-1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([JO|M]));
            });
        })

        describe('split tests', () => {
            it('Checks basic organism splitting',  () => {
                run([[1|M,2,SP|M]], {molAmount: 0}, [0]);
                const org = vm.orgs.get(0);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([2,SP|M]));
                expect(org.re).toEqual(RE_OK);
            });
            it('Checks basic organism splitting (two molecules)',  () => {
                run([[RH|M,RM|M,SP|M]], {molAmount: 0}, [0]);
                const org = vm.orgs.get(0);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([SP|M]));
                expect(vm.orgsMols.get(1).code).toEqual(Uint8Array.from([RH|M,RM|M]));
                expect(org.re).toEqual(RE_OK);
            });
            it('Checks organism splitting fail, because position is not free',  () => {
                run([[2|M],[SP|M]], {molAmount: 0}, [1,0]);
                const org = vm.orgs.get(1);

                expect(vm.orgs.items).toBe(2);
                expect(vm.orgsMols.items).toBe(2); 
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).offset).toBe(1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2|M]));
                expect(org.offset).toBe(0);
                expect(org.code).toEqual(Uint8Array.from([SP|M]));
                expect(org.re).toEqual(RE_ERR);
            });
            it('Checks organism splitting fail, because orgsMols is full',  () => {
                const _orgsMolsAmount = BioVM._orgsMolsAmount;
                BioVM._orgsMolsAmount = () => 0;
                run([[1|M,SP|M]], {molAmount: 0}, [0]);
                BioVM._orgsMolsAmount = _orgsMolsAmount;

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(1)).toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([1|M,SP|M]));
                expect(vm.orgs.get(0).re).toBe(RE_ERR);
            });
            it('Checks basic organism splitting by clonning himself',  () => {
                const ar = BioVM.prototype.afterRun;
                BioVM.prototype.afterRun = () => {};
                run([[SP|M]], {molAmount: 0}, [0]);
                BioVM.prototype.afterRun = ar;
                const mol = vm.orgsMols.get(0);

                expect(vm.orgs.items).toBe(0);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(mol.code).toEqual(Uint8Array.from([SP|M]));
            });
            it('Checks basic organism splitting at the edge of the world',  () => {
                run([[1|M,SP|M]], {molAmount: 0}, [WIDTH - 1]);
                const org = vm.orgs.get(0);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(WIDTH)).not.toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([SP|M]));
                expect(org.re).toEqual(RE_OK);
            });
            it('Checks basic organism splitting at the edge of the world (at 0 position)',  () => {
                run([[6,DR|M,SP|M]], {molAmount: 0}, [0]);
                const org = vm.orgs.get(0);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(WIDTH * (HEIGHT - 1))).not.toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([SP|M]));
                expect(org.re).toEqual(RE_SPECIAL);
            });
            it('Checks basic organism splitting at the center',  () => {
                run([[RM|M,RH|M,RM,RM,LH|M,SP|M]], {molAmount: 0}, [0]);
                const org = vm.orgs.get(0);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([RM|M,SP|M]));
                expect(org.re).toEqual(RE_OK);
            });
            it('Checks basic organism cloning',  () => {
                run([[Config.CODE_ORG_ID,SA|M,SP|M]], {molAmount: 0}, [0]);

                expect(vm.orgs.items).toBe(2);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([SP|M]));
            });
            it('Checks correct running after cloning',  () => {
                run([[0,SP,0|M,1|M]], {molAmount: 0}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.orgs.get(0).ax).toEqual(1);
            });
            it('Checks correct running after cloning 1',  () => {
                run([[RM|M,RH|M,RM,RM,LH,SP,1|M]], {molAmount: 0}, [0]);
                const org = vm.orgs.get(0);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([RM|M]));
                expect(org.re).toEqual(RE_OK);
            });
        });

        describe('step tests', () => {
            it('Checks step up', () => {
                run([[0,DR,ST|M]], {molAmount: 0}, [WIDTH]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([0,DR,ST|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
            });
            it('Checks step up-right', () => {
                run([[1,DR,ST|M]], {molAmount: 0}, [WIDTH]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([1,DR,ST|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
            });
            it('Checks step right', () => {
                run([[2,DR,ST|M]], {molAmount: 0}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2,DR,ST|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
            });
            it('Checks step right-down', () => {
                run([[3,DR,ST|M]], {molAmount: 0}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(WIDTH + 1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([3,DR,ST|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
            });
            it('Checks step down', () => {
                run([[4,DR,ST|M]], {molAmount: 0}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(WIDTH)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([4,DR,ST|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
            });
            it('Checks step down-left', () => {
                run([[5,DR,ST|M]], {molAmount: 0}, [1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(WIDTH)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([5,DR,ST|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
            });
            it('Checks step left', () => {
                run([[6,DR,ST|M]], {molAmount: 0}, [1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([6,DR,ST|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
            });
            it('Checks step left-up', () => {
                run([[7,DR,ST|M]], {molAmount: 0}, [WIDTH + 1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([7,DR,ST|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
            });
            it('Checks step outside up (cyclical world)', () => {
                run([[DR,ST|M]], {molAmount: 0}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(0)).toBe(-1);
                expect(vm.world.index(WIDTH * HEIGHT - WIDTH)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([DR,ST|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_SPECIAL);
            });
            it('Checks step outside down (cyclical world)', () => {
                run([[4,DR,ST|M]], {molAmount: 0}, [WIDTH * HEIGHT - WIDTH]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(WIDTH * HEIGHT - WIDTH)).toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([4,DR,ST|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_SPECIAL);
            });
            it('Checks step outside left (cyclical world)', () => {
                run([[6,DR,ST|M]], {molAmount: 0}, [WIDTH]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(WIDTH)).toBe(-1);
                expect(vm.world.index(WIDTH-1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([6,DR,ST|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
            });
            it('Checks step outside right (cyclical world)', () => {
                run([[2,DR,ST|M]], {molAmount: 0}, [WIDTH-1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(WIDTH)).not.toBe(-1);
                expect(vm.world.index(WIDTH-1)).toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2,DR,ST|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
            });
            it('Checks step impossible because another organism is there', () => {
                run([[0|M], [ST|M]], {molAmount: 0}, [1, 0]);

                expect(vm.orgs.items).toBe(2);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([0|M]));
                expect(vm.orgs.get(1).code).toEqual(Uint8Array.from([ST|M]));
                expect(vm.orgs.get(1).re).toEqual(RE_ERR);
            });
            it('Checks step impossible because molecule is there', () => {
                run([[ST|M], [0|M]], {molAmount: 1}, [0, 1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([ST|M]));
                expect(vm.orgsMols.get(1).code).toEqual(Uint8Array.from([0|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_ERR);
            });
        });

        describe('see tests', () => {
            it('see right on molecule', () => {
                run([[1,SE|M],[2|M]], {molAmount: 1}, [0,1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.orgs.get(0).ax).toEqual(2);
            })
            it('see right on other organism', () => {
                run([[1,SE|M],[3|M]], {molAmount: 0}, [0,1]);

                expect(vm.orgs.items).toBe(2);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.orgs.get(0).ax).toEqual(0xFF0000);
            })
            it('see right on empty cell', () => {
                run([[1,SE]], {molAmount: 0}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).ax).toEqual(0);
            })
            it('see left out of the world', () => {
                run([[0,DE,SE]], {molAmount: 0}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).ax).toEqual(0);
            })
        });

        describe('say tests', () => {
            it('Checks say with 1 on frequency 1', () => {
                run2([1,TG,1,SY|M], 1, 1);

                expect(vm.freq[1]).toEqual(1);
            })
            it('Checks say with 1 on frequency 0', () => {
                run2([TG,1,SY|M], 1);

                expect(vm.freq[1]).toEqual(0);
                expect(vm.freq[0]).toEqual(1);
            })
        });

        describe('listen tests', () => {
            it('Checks listen on frequency 1', () => run2([1,TG,1,SY,0,LN|M], 1, 1));
            it('Checks listen on frequency 0', () => run2([1,SY,0,LN|M], 1));
        });

        describe('nread tests', () => {
            it('Reads empty dot', () => run2([NR|M]));
            it('Reads empty dot out of the world', () => run2([DR,NR|M]));
            it('Reads near organism',  () => {
                run([[NR|M], [1|M]], {molAmount: 0}, [0, 1]);

                expect(vm.orgs.items).toBe(2);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([NR|M]));
                expect(vm.orgs.get(1).code).toEqual(Uint8Array.from([1|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
                expect(vm.orgs.get(0).ax).toEqual(1|M);
            });
            it('Reads near organism 1',  () => {
                run([[1,NR|M], [1,2,3|M]], {molAmount: 0}, [0, 1]);

                expect(vm.orgs.items).toBe(2);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([1,NR|M]));
                expect(vm.orgs.get(1).code).toEqual(Uint8Array.from([1,2,3|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
                expect(vm.orgs.get(0).ax).toEqual(2);
            });
            it('Reads near molecule',  () => {
                run([[2,NR|M], [1,2,3|M]], {molAmount: 1}, [0, 1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2,NR|M]));
                expect(vm.orgsMols.get(1).code).toEqual(Uint8Array.from([1,2,3|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
                expect(vm.orgs.get(0).ax).toEqual(3|M);
            });
            it('Reads near molecule with wrong index (> length)',  () => {
                run([[4,NR|M], [1,2,3|M]], {molAmount: 1}, [0, 1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([4,NR|M]));
                expect(vm.orgsMols.get(1).code).toEqual(Uint8Array.from([1,2,3|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
                expect(vm.orgs.get(0).ax).toEqual(3|M);
            });
            it('Reads near molecule with wrong index (< 0)',  () => {
                run([[0,DE,NR|M], [1,2,3|M]], {molAmount: 1}, [0, 1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([0,DE,NR|M]));
                expect(vm.orgsMols.get(1).code).toEqual(Uint8Array.from([1,2,3|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
                expect(vm.orgs.get(0).ax).toEqual(1);
            });
        });

        describe('get tests', () => {
            it('Gets near organism',  () => {
                run([[GE|M], [1|M]], {molAmount: 0}, [0, 1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(1)).toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([GE|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
            });
            it('Gets nothing',  () => {
                run([[4,DR,GE|M], [1|M]], {molAmount: 1}, [0, 1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.world.index(WIDTH)).toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([4,DR,GE|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_ERR);
            });
        });

        describe('put tests', () => {
            it('Puts organism on the right',  () => {
                run([[GE,4,DR,PU|M], [1|M]], {molAmount: 0}, [0, 1]);

                expect(vm.orgs.items).toBe(2);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(1)).toBe(-1);
                expect(vm.world.index(WIDTH)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([GE,4,DR,PU|M]));
                expect(vm.orgsMols.get(1).code).toEqual(Uint8Array.from([1|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_OK);
            });
            it('Puts nothing',  () => {
                run([[PU|M]], {molAmount: 0}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(1)).toBe(-1);
                expect(vm.world.index(WIDTH)).toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([PU|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_ERR);
            });
            it('Puts organism two times',  () => {
                run([[GE,4,DR,PU,3,DR,PU|M], [1|M]], {molAmount: 0}, [0, 1]);

                expect(vm.orgs.items).toBe(2);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(1)).toBe(-1);
                expect(vm.world.index(WIDTH)).not.toBe(-1);
                expect(vm.world.index(WIDTH + 1)).toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([GE,4,DR,PU,3,DR,PU|M]));
                expect(vm.orgsMols.get(1).code).toEqual(Uint8Array.from([1|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_ERR);
            });
            it('Puts organism out of the world',  () => {
                run([[GE,6,DR,PU|M], [1|M]], {molAmount: 0}, [0, 1]);

                expect(vm.orgs.items).toBe(2);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(1)).toBe(-1);
                expect(vm.world.index(WIDTH * HEIGHT - WIDTH)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([GE,6,DR,PU|M]));
                expect(vm.orgsMols.get(1).code).toEqual(Uint8Array.from([1|M]));
                expect(vm.orgs.get(0).re).toEqual(RE_SPECIAL);
            });
        });

        describe('offs tests', () => {
            it('Simple offset test', () => {
                run([[1,OF|M]], {molAmount: 0}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).ax).toEqual(0);
                expect(vm.orgsMols.get(0).code).toEqual(Uint8Array.from([1,OF|M]));
            });
            it('Simple offset test 1', () => {
                run([[OF|M]], {molAmount: 0}, [1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).ax).toEqual(1);
                expect(vm.orgsMols.get(0).code).toEqual(Uint8Array.from([OF|M]));
            });
            it('Simple offset test 2', () => {
                run([[OF|M]], {molAmount: 0}, [WIDTH - 1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).ax).toEqual(WIDTH - 1);
                expect(vm.orgsMols.get(0).code).toEqual(Uint8Array.from([OF|M]));
            });
        });

        describe('color tests', () => {
            it('organism color', () => {
                run2([1,CO|M], 1);

                expect(vm.orgs.get(0).color).toEqual(Config.ORG_MIN_COLOR);
            });
            it('organism negative color', () => {
                run2([0,DE,CO|M], -1);

                expect(vm.orgs.get(0).color).toEqual(Config.ORG_MIN_COLOR);
            });
            it('organism norrmal color', () => {
                const color = 0x20000;
                run2([16,TG,2,LS,CO|M], color, 16);

                expect(vm.orgs.get(0).color).toEqual(color);
            });
        });

        describe('anab tests', () => {
            describe('anabolism of near mols', () => {
                it('simple anabolism of nearest molecules', () => {
                    run2([DE|M,AN|M], -1, 0, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([DE,AN|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy - (org.code.length * Config.energyMetabolismCoef) - 1);
                });
                it('simple anabolism of nearest molecules 1', () => {
                    run2([1,0,DE|M,AN|M], -1, 0, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([1,0,DE,AN|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy - (org.code.length * Config.energyMetabolismCoef) - 1);
                });
                it('simple anabolism of nearest molecules 2', () => {
                    run2([2|M,1,0,DE|M,AN|M], -1, 0, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([2,1,0,DE|M,AN|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy - ((org.code.length - 1) * Config.energyMetabolismCoef) - 1);
                });
                it('anabolism of one mol', () => {
                    run2([DE,AN|M], -1, 0, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([DE,AN|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy - 1);
                });
                it('anabolism of mols 2 and 3', () => {
                    run2([RM|M,DE|M,AN|M], -1, 0, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([RM|M,DE,AN|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy - ((org.code.length - 1) * Config.energyMetabolismCoef) - 1);
                });
            });
            describe('anabolism of far mols', () => {
                it('anabolism of mols 3 and 1', () => {
                    run2([RM,RM|M,1|M,AN|M], 1, 0, RE_OK, false);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([1|M,AN,RM,RM|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy - (3 * Config.energyMetabolismCoef) - 1);
                });
                it('anabolism of mols 1 and 3', () => {
                    run2([RH,RM,RM|M,LH|M,AN|M], 0, 0, RE_OK, false);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([RH,RM,RM,AN|M,LH|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy - (4 * Config.energyMetabolismCoef) - 1);
                });
                it('anabolism of one mol 1', () => {
                    run2([AN|M], 0, 0, RE_ERR);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([AN|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy - 1);
                });
                it('anabolism of mols 2 and 3 of 4', () => {
                    run2([RH|M,RM,RM|M,LH,RM|M,AN|M], 0, 0, RE_OK, false);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([RH|M,RM,RM,LH,RM|M,AN|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy - (4 * Config.energyMetabolismCoef) - 1);
                });
                it('anabolism of mols 2 and 3 of 4 (1)', () => {
                    run2([RH|M,RM|M,LH,RM,RM|M,AN|M], 0, 0, RE_OK, false);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([RH|M,LH,RM,RM,RM|M,AN|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy - (4 * Config.energyMetabolismCoef) - 1);
                });
                it('Checks anabolism and metadata', () => {
                    run2([RH,RM,RM,LH|M,AN|M,1|M], 0, 0, RE_OK, false);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([RH,RM,RM,LH,1,AN|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy - ((5 + 6) * Config.energyMetabolismCoef) - 1);
                });
            });
        });

        describe('catab tests', () => {
            describe('catabolist by absolute index in bx', () => {
                it('simple catabolism of atom 0', () => {
                    run2([DE,CT,1|M], 1, 0, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([DE|M,CT,1|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy + (org.code.length * Config.energyMetabolismCoef) - 1);
                });
                it('simple catabolism of atom 1', () => {
                    run2([1,TG,DE,CT,1|M], 1, 1, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([1,TG|M,DE,CT,1|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy + (org.code.length * Config.energyMetabolismCoef) - 1);
                });
                it('simple catabolism of atom -1', () => {
                    run2([DE,TG,DE,CT,1|M], 1, -1, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([DE|M,TG,DE,CT,1|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy + (org.code.length * Config.energyMetabolismCoef) - 1);
                });
                it('simple catabolism of atom 10', () => {
                    run2([10,TG,DE,CT,1|M], 1, 10, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([10,TG,DE,CT,1|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy - 1);
                });
            });
            describe('catabolist by head and index in ax', () => {
                it('simple catabolism of mol 0', () => {
                    run2([CT,1|M], 1, 0, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([CT|M,1|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy + (org.code.length * Config.energyMetabolismCoef) - 1);
                });
                it('simple catabolism of mol 0 and idx 1', () => {
                    run2([1,CT,0,1|M], 1, 0, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([1,CT|M,0,1|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy + (org.code.length * Config.energyMetabolismCoef) - 1);
                });
                it('simple catabolism of mol 0 and idx -1', () => {
                    run2([DE,CT,0,1|M], 1, 0, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([DE|M,CT,0,1|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy + (org.code.length * Config.energyMetabolismCoef) - 1);
                });
                it('simple catabolism of mol 0 and idx 10', () => {
                    run2([10,CT,0,1|M], 1, 0, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([10|M,CT,0,1|M]));
                    expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy + (org.code.length * Config.energyMetabolismCoef) - 1);
                });
            });
        });

        describe('mmol tests', () => {
            it('mmol of one mol', () => {
                run2([MM|M]);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([MM|M]));
                expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy - 1);
            })
            it('mmol of two mols', () => {
                run2([RH|M,RM,RM,LH,MM|M,1|M], 0, 0, RE_OK, false);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([RH|M,RM,RM,LH,MM|M,1|M]));
                expect(vm.orgs.get(0).energy).toEqual(Config.LUCAS[0].energy - Math.round(((1 + 4) * Config.energyMolMoveCoef)) - 1);
            })
        });

        describe('mol tests', () => {
            it('mol test', () => {
                run2([MO|M]);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([MO|M]));
            })
            it('mol test 1', () => {
                run2([1,MO|M], 0, 1);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([1,MO|M]));
            })
            it('mol test 2', () => {
                run2([MO,MO|M], 0, 1);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([MO,MO|M]));
            })
            it('mol test 3', () => {
                run2([MO|M,MO|M]);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([MO|M,MO|M]));
            })
            it('mol test of mol 1', () => {
                run2([RM|M,MO|M], 1, 1, RE_OK);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([RM|M,MO|M]));
            })
        });

        describe('smol tests', () => {
            it('set 0 mol', () => {
                run2([SM|M]);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([SM|M]));
            })
            it('set 0 mol (1)', () => {
                run2([1,SM|M,0|M]);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([1,SM|M,0|M]));
                expect(org.heads[org.head]).toEqual(0);
            })
            it('set 1 mol', () => {
                run2([2,SM|M,0|M]);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([2,SM|M,0|M]));
                expect(org.heads[org.head]).toEqual(2);
            })
            it('set 0 mol with long mol', () => {
                run2([0,1,2,SM|M]);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([0,1,2,SM|M]));
                expect(org.heads[org.head]).toEqual(0);
            })
            it('set -1 mol', () => {
                run2([DE,SM|M]);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([DE,SM|M]));
                expect(org.heads[org.head]).toEqual(0);
            })
            it('set 10 mol', () => {
                run2([10,SM|M]);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([10,SM|M]));
                expect(org.heads[org.head]).toEqual(0);
            })
        });

        describe('rmol tests', () => {
            it('rmol 0 -> 1', () => {
                run2([RM|M,0|M], 0, 0, RE_OK);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([RM|M,0|M]));
                expect(org.heads[org.head]).toEqual(1);
            })
            it('rmol 0 -> 0', () => {
                run2([RM,RM|M,0|M], 0, 0, RE_SPECIAL);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([RM,RM|M,0|M]));
                expect(org.heads[org.head]).toEqual(0);
            })
            it('rmol 1 -> 0', () => {
                run2([RM,RM,RM|M,0|M], 0, 0, RE_OK);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([RM,RM,RM|M,0|M]));
                expect(org.heads[org.head]).toEqual(3);
            })
            it('rmol 0 -> 1 (1)', () => {
                run2([RM,RM|M,0|M,1,2,3|M], 3, 0, RE_OK);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([RM,RM|M,0|M,1,2,3|M]));
                expect(org.heads[org.head]).toEqual(3);
            })
        })

        describe('lmol tests', () => {
            it('lmol 0 -> 1', () => {
                run2([LM|M,0|M], 0, 0, RE_SPECIAL);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([LM|M,0|M]));
                expect(org.heads[org.head]).toEqual(1);
            })
            it('lmol 0 -> 0', () => {
                run2([LM,LM|M,0|M], 0, 0, RE_OK);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([LM,LM|M,0|M]));
                expect(org.heads[org.head]).toEqual(0);
            })
            it('lmol 0 -> 0 (1)', () => {
                run2([LM,LM,LM|M,0|M], 0, 0, RE_SPECIAL);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([LM,LM,LM|M,0|M]));
                expect(org.heads[org.head]).toEqual(3);
            })
            it('lmol 0 -> 1 (1)', () => {
                run2([LM,LM|M,0|M,1,2,3|M], 3, 0, RE_OK);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([LM,LM|M,0|M,1,2,3|M]));
                expect(org.heads[org.head]).toEqual(2);
            })
        })

        describe('cmol tests', () => {
            it('cmol of one mol', () => {
                run2([CM|M]);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([CM|M]));
                expect(org.mem[org.mPos]).toEqual(CM|M);
                expect(org.heads[org.head]).toEqual(0);
            })
            it('cmol of one mols with two atoms', () => {
                run2([CM,1|M], 1);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([CM,1|M]));
                expect(org.mem[org.mPos]).toEqual(CM);
                expect(org.mem[org.mPos + 1]).toEqual(1|M);
                expect(org.heads[org.head]).toEqual(0);
            })
            it('cmol of two mols', () => {
                run2([CM,1|M,1|M], 1);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([CM,1|M,1|M]));
                expect(org.mem[org.mPos]).toEqual(CM);
                expect(org.mem[org.mPos + 1]).toEqual(1|M);
                expect(org.mem[org.mPos + 2]).toEqual(0);
                expect(org.heads[org.head]).toEqual(0);
            })
            it('cmol of last mol', () => {
                run2([RM,CM|M,1|M], 1, 0, RE_OK);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([RM,CM|M,1|M]));
                expect(org.mem[org.mPos]).toEqual(1|M);
                expect(org.mem[org.mPos + 1]).toEqual(0);
                expect(org.heads[org.head]).toEqual(2);
            })
        })

        describe('mcmp tests', () => {
            describe('ax < 1', () => {
                it('mcmp of one mol', () => {
                    run2([MC|M], 0, 0, RE_ERR);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([MC|M]));
                    expect(org.mem[org.mPos]).toEqual(0);
                    expect(org.heads[org.head]).toEqual(0);
                })
                it('mcmp of one mol (1)', () => {
                    run2([CM|M,MC|M], 0, 0, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([CM|M,MC|M]));
                    expect(org.mem[org.mPos]).toEqual(CM|M);
                    expect(org.mem[org.mPos + 1]).toEqual(0);
                    expect(org.heads[org.head]).toEqual(0);
                })
                it('mcmp of one mol (2)', () => {
                    run2([1|M,SA,MC|M], 1, 0, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([1|M,SA,MC|M]));
                    expect(org.mem[org.mPos]).toEqual(1);
                    expect(org.heads[org.head]).toEqual(0);
                })
            })
            describe('ax > 0', () => {
                it('mcmp of first mol', () => {
                    run2([1,MC|M], 1, 0, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([1,MC|M]));
                    expect(org.mem[org.mPos]).toEqual(0);
                    expect(org.heads[org.head]).toEqual(0);
                })
                it('mcmp of first and second mols', () => {
                    run2([RH,RM,LH,RM,RM,1,MC|M,1|M,1|M], 1, 0, RE_OK);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([RH,RM,LH,RM,RM,1,MC|M,1|M,1|M]));
                    expect(org.mem[org.mPos]).toEqual(0);
                    expect(org.heads[org.head]).toEqual(8);
                    expect(org.heads[org.head + 1]).toEqual(7);
                })
                it('mcmp of first and second mols with different length', () => {
                    run2([RH,RM,LH,RM,RM,1,MC|M,1|M,1,2|M], 2, 0, RE_ERR);
                    const org = vm.orgs.get(0);
    
                    expect(org.code).toEqual(Uint8Array.from([RH,RM,LH,RM,RM,1,MC|M,1|M,1,2|M]));
                    expect(org.mem[org.mPos]).toEqual(0);
                    expect(org.heads[org.head]).toEqual(8);
                    expect(org.heads[org.head + 1]).toEqual(7);
                })
            })
        })

        describe('asm tests', () => {
            it('asm of one mol with fail', () => {
                run2([1|M,AS|M], 1, 0, RE_OK, false);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([AS|M,1|M]));
                expect(org.heads[org.head]).toEqual(0);
                expect(org.heads[org.head + 1]).toEqual(0);
            })
            it('asm of one mol', () => {
                run2([RM,RH,RM,RM,RH,RM,RM,11,AS|M,1|M,1|M,0|M], 1, 0, RE_OK);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([RM,RH,RM,RM,RH,RM,RM,11,AS|M,1|M,0|M,1|M]));
                expect(org.energy).toEqual(Config.LUCAS[0].energy - (0 * Config.energyMetabolismCoef) - 1);
            })
            it('asm of one mol (1)', () => {
                run2([RM,RH,RM,RM,RH,RM,RM,13,AS|M,0,1|M,0,1|M,0|M], 1, 0, RE_OK);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([RM,RH,RM,RM,RH,RM,RM,13,AS|M,0,1|M,0|M,0,1|M]));
                expect(org.energy).toEqual(Config.LUCAS[0].energy - (0 * Config.energyMetabolismCoef) - 1);
            })
            it('asm of one mol from smaller mols', () => {
                run2([RM,RH,RM,RM,RH,RM,RM,RM,LH,LH,18,AS|M,0,1,2|M,0|M,1,2|M,9|M], 2, 0, RE_OK);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([RM,RH,RM,RM,RH,RM,RM,RM,LH,LH,18,AS|M,0,1,2|M,9|M,0,1,2|M]));
                expect(org.energy).toEqual(Config.LUCAS[0].energy - (3 * Config.energyMetabolismCoef) - 1);
            })
            it('asm of one mol from smaller mols (1)', () => {
                run2([RM,RH,RM,RM,RH,RM,RM,RM,RM,LH,LH,19,AS|M,0,1,2|M,0|M,1|M,2|M,9|M], 2, 0, RE_OK);
                const org = vm.orgs.get(0);

                expect(org.code).toEqual(Uint8Array.from([RM,RH,RM,RM,RH,RM,RM,RM,RM,LH,LH,19,AS|M,0,1,2|M,9|M,0,1,2|M]));
                expect(org.energy).toEqual(Config.LUCAS[0].energy - ((2 + 3) * Config.energyMetabolismCoef) - 1);
            })
        });
    });
});