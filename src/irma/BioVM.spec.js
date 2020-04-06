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
    const RM         = Config.CODE_CMDS.RMOL;
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
            if (org.hasOwnProperty('energy')) {
                vm.world.moveOrg(org, move[i]);
            } else {
                vm.world.empty(org.offset);
                vm.world.mol(move[i], org, vm.molColor(org.code));
            }
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
        expect(org.code).toEqual(Uint8Array.from(code));
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
                expect(org.ax).toBe(2);
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
        });

        describe('see tests', () => {
            it('see right on other organism', () => {
                run([[1,SE],[2]], {molAmount: 1}, [0,1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.orgs.get(0).ax).toEqual(2); 
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
            // it('see up on molecule', () => {
            //     run([[WIDTH-1,NT,SE],[3]], {molAmount: 1, orgAmount: 1}, [WIDTH,0]);

            //     expect(vm.orgs.items).toBe(1);
            //     expect(vm.orgsMols.items).toBe(2);
            //     expect(vm.orgs.get(0).ax).toEqual(3);
            // })
        });

        xdescribe('offs tests', () => {
            it('Simple offset test', () => {
                run([[1,OF]], {molAmount: 0, orgAmount: 1}, [1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).ax).toEqual(1);
            });
            it('Simple offset test2', () => {
                run([[1,OF]], {molAmount: 0, orgAmount: 1}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).ax).toEqual(0);
            });
            it('Simple offset test3', () => {
                run([[1,OF]], {molAmount: 0, orgAmount: 1}, [WIDTH*HEIGHT-1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).ax).toEqual(WIDTH*HEIGHT-1);
            });
        });

        xdescribe('color tests', () => {
            it('organism color', () => {
                expect(vm.orgs.get(0).color).toEqual(Config.orgColor);
                run2([2,CO], 2);

                expect(vm.orgs.get(0).color).toEqual(Config.ORG_MIN_COLOR);
            });
            it('organism negative color', () => {
                expect(vm.orgs.get(0).color).toEqual(Config.orgColor);
                run2([2,NT,CO], -3);

                expect(vm.orgs.get(0).color).toEqual(Config.ORG_MIN_COLOR);
            });
        });

        xdescribe('anab tests', () => {
            it('simple anabolism', () => {
                const code   = vm.split2Mols(Uint8Array.from([1,TG,0,AB]));
                const energy = Config.energyMetabolismCoef * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                Compiler.compile(org);
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([1,TG,0,AB|M]));
                expect(vm.orgs.get(0).energy).toEqual(energy - (code.length * Config.energyMetabolismCoef) - 1);
            });
            it('anabolism of one molecule only', () => {
                const code   = vm.split2Mols(Uint8Array.from([AB]));
                const energy = Config.energyMetabolismCoef * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                Compiler.compile(org);
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([AB|M]));
                expect(vm.orgs.get(0).energy).toEqual(energy - 1);
                expect(vm.orgs.get(0).re).toEqual(0);
            });
            it('joining two molecules from different places', () => {
                const code   = vm.split2Mols(Uint8Array.from([2,TG,0,0,0,AB]));
                const energy = Config.energyMetabolismCoef * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                Compiler.compile(org);
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2,TG,0,AB|M,0,0|M]));
                expect(vm.orgs.get(0).energy).toEqual(energy - (4 * Config.energyMetabolismCoef) - 1);
            });
            it('joining two molecules when ax < 0', () => {
                const code   = vm.split2Mols(Uint8Array.from([2,TG,0,0,0,NT,AB]));
                const energy = Config.energyMetabolismCoef * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                Compiler.compile(org);
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2,TG,0,NT|M,0,0|M,AB|M]));
                expect(vm.orgs.get(0).energy).toEqual(energy - (4 * Config.energyMetabolismCoef) - 1);
            });
            it('joining two molecules when bx > molAmount', () => {
                const code   = vm.split2Mols(Uint8Array.from([20,TG,0,0,0,AB]));
                const energy = Config.energyMetabolismCoef * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                Compiler.compile(org);
                org.energy = energy;
                vm.run();

                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([20,TG,0,AB|M,0,0|M]));
                expect(vm.orgs.get(0).energy).toEqual(energy - 4 * Config.energyMetabolismCoef - 1);
                expect(vm.orgs.get(0).re).toEqual(1);
            });
        });

        xdescribe('catab tests', () => {
            it('simple catabolism', () => {
                const code   = vm.split2Mols(Uint8Array.from([0,CB]));
                const energy = Config.energyMetabolismCoef * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                Compiler.compile(org);
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([0|M,CB|M]));
                expect(vm.orgs.get(0).energy).toEqual(energy + (code.length * Config.energyMetabolismCoef) - 1);
                expect(vm.orgs.get(0).re).toEqual(1);
            });
            it('simple catabolism with longer molecule', () => {
                const code   = vm.split2Mols(Uint8Array.from([0,1,2,3,4,1,CB]));
                const energy = Config.energyMetabolismCoef * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                Compiler.compile(org);
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([0,1|M,2|M,3|M,4,1|M,CB|M]));
                expect(vm.orgs.get(0).energy).toEqual(energy + (2 * Config.energyMetabolismCoef) - 1);
                expect(vm.orgs.get(0).re).toEqual(1);
            });
            it('catabolism if ax < 0', () => {
                const code   = vm.split2Mols(Uint8Array.from([1,NT,CB]));
                const energy = Config.energyMetabolismCoef * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                Compiler.compile(org);
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([1|M,NT|M,CB|M]));
                expect(vm.orgs.get(0).energy).toEqual(energy + (2 * Config.energyMetabolismCoef) - 1);
                expect(vm.orgs.get(0).re).toEqual(1);
            });
            it('catabolism if ax > molAmount', () => {
                const code   = vm.split2Mols(Uint8Array.from([10,CB]));
                const energy = Config.energyMetabolismCoef * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                Compiler.compile(org);
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([10|M,CB|M]));
                expect(vm.orgs.get(0).energy).toEqual(energy + 2 * Config.energyMetabolismCoef - 1);
                expect(vm.orgs.get(0).re).toEqual(1);
            });
        });

        xdescribe('find tests', () => {
            it('find molecule [3,AR] at the end',     () => run2(vm.split2Mols([3,AR,1,TG,FI,0,3,AR]), 3, 1, 3));
            it('find molecule [3] at the middle',     () => run2([3|M,AR|M,3|M,1,TG,FI|M], 2, 1, 1));
            it('find molecule [0] at the beginning',  () => run2([0|M,4,AR|M,0,FI|M], 0, 0, 1));
            it('find molecule [0,1] at the end',      () => run2([0,1|M,4,AR|M,1,TG,0,FI|M,0,1|M], 3, 1, 1));
            it('should not find molecule [0]',        () => run2([0|M,4,AR|M,1,FI|M], 1, 0, 0));
        });

        xdescribe('move tests', () => {
            it('move first molecule to the center', () => {
                const code = Uint8Array.from([0,1,2,2,TG,MO]);
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = vm.split2Mols(code);
                Compiler.compile(org);
                vm.run();
        
                expect(org.ax).toBe(0);
                expect(org.bx).toBe(2);
                expect(org.re).toBe(1);
                expect(org.code).toEqual(Uint8Array.from([2,2|M,0,1|M,TG,MO|M]));
            });
            it('move first molecule with bx > molAmount', () => {
                const code = Uint8Array.from([0,1,2,5,TG,MO]);
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = vm.split2Mols(code);
                Compiler.compile(org);
                vm.run();
        
                expect(org.ax).toBe(0);
                expect(org.bx).toBe(5);
                expect(org.re).toBe(1);
                expect(org.code).toEqual(Uint8Array.from([2,5|M,0,1|M,TG,MO|M]));
            });
            it('move first molecule with ax < 0', () => {
                const code = Uint8Array.from([0,1,2,5,TG,0,NT,MO]);
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = vm.split2Mols(code);
                Compiler.compile(org);
                vm.run();
        
                expect(org.ax).toBe(-1);
                expect(org.bx).toBe(5);
                expect(org.re).toBe(1);
                expect(org.code).toEqual(Uint8Array.from([2,5|M,TG,0|M,0,1|M,NT,MO|M]));
            });
        });

        xdescribe('mols tests', () => {
            it('mols0', () => run2([0|M,1,ML|M], 2));
            it('mols1', () => run2([ML|M], 1));
            it('mols2', () => run2([ML], 1));
        });

        // describe('mcmp tests', () => {
        //     it('compare two commands', () => {
        //         const code = [0,1,TG,0,CM];
        //         Config.codeLinesPerIteration = code.length;
        //         const vm1 = new VM(1);
        //         const org = vm1.addOrg(0, code);
        //         org.mem   = Int32Array.from([0,1,2,3,4,5]);
        //         vm1.run();

        //         expect(org.ax).toBe(0);
        //         expect(org.bx).toBe(1);
        //         expect(org.re).toBe(1);
        //         expect(org.code).toEqual(code);
        //         expect(org.line).toEqual(code.length);
        //         expect(org.mem).toEqual(Int32Array.from([0,1,2,3,4,5]));
        //         vm1.destroy();
        //     });
        //     it('compare two other commands', () => {
        //         const code = [0,2,TG,1,CM];
        //         Config.codeLinesPerIteration = code.length;
        //         const vm1  = new VM(1);
        //         const org  = vm1.addOrg(0, code);
        //         org.mem    = Int32Array.from([0,2,TG,3,4,5]);
        //         org.mPos = 1;
        //         vm1.run();

        //         expect(org.ax).toBe(1);
        //         expect(org.bx).toBe(2);
        //         expect(org.re).toBe(1);
        //         expect(org.code).toEqual(code);
        //         expect(org.line).toEqual(code.length);
        //         expect(org.mem).toEqual(Int32Array.from([0,2,TG,3,4,5]));
        //         vm1.destroy();
        //     });
        //     it('compare one command1', () => {
        //         const code = [0,1,TG,1,CM];
        //         Config.codeLinesPerIteration = code.length;
        //         const vm1  = new VM(1);
        //         const org  = vm1.addOrg(0, code);
        //         org.mem    = Int32Array.from([0,1,2,3,4,5]);
        //         org.mPos = 1;
        //         vm1.run();

        //         expect(org.ax).toBe(1);
        //         expect(org.bx).toBe(1);
        //         expect(org.re).toBe(1);
        //         expect(org.code).toEqual(code);
        //         expect(org.line).toEqual(code.length);
        //         expect(org.mem).toEqual(Int32Array.from([0,1,2,3,4,5]));
        //         vm1.destroy();
        //     });
        //     it('compare one command2', () => {
        //         const code = [0,0,TG,0,CM];
        //         Config.codeLinesPerIteration = code.length;
        //         const vm1  = new VM(1);
        //         const org  = vm1.addOrg(0, code);
        //         org.mem    = Int32Array.from([0,0,2,3,4,5]);
        //         org.mPos = 1;
        //         vm1.run();

        //         expect(org.ax).toBe(0);
        //         expect(org.bx).toBe(0);
        //         expect(org.re).toBe(1);
        //         expect(org.code).toEqual(code);
        //         expect(org.line).toEqual(code.length);
        //         expect(org.mem).toEqual(Int32Array.from([0,0,2,3,4,5]));
        //         vm1.destroy();
        //     });
        //     it('compare with negative indexes', () => {
        //         const code = [0,NT,TG,1,NT,CM];
        //         Config.codeLinesPerIteration = code.length;
        //         const vm1  = new VM(1);
        //         const org  = vm1.addOrg(0, code);
        //         org.mem    = Int32Array.from([0,2,3,4,5]);
        //         vm1.run();

        //         expect(org.ax).toBe(0);
        //         expect(org.bx).toBe(0);
        //         expect(org.re).toBe(1);
        //         expect(org.code).toEqual(code);
        //         expect(org.line).toEqual(code.length);
        //         expect(org.mem).toEqual(Int32Array.from([0,2,3,4,5]));
        //         vm1.destroy();
        //     });
        //     it('compare with big indexes', () => {
        //         const code = [10,TG,20,CM];
        //         Config.codeLinesPerIteration = code.length;
        //         const vm1  = new VM(1);
        //         const org  = vm1.addOrg(0, code);
        //         org.mem    = Int32Array.from([CM,2,3,4,5]);
        //         vm1.run();

        //         expect(org.ax).toBe(3);
        //         expect(org.bx).toBe(3);
        //         expect(org.re).toBe(1);
        //         expect(org.code).toEqual(code);
        //         expect(org.line).toEqual(code.length);
        //         expect(org.mem).toEqual(Int32Array.from([CM,2,3,4,5]));
        //         vm1.destroy();
        //     });
        //     it('compare with incorrect indexes sequence', () => {
        //         const code = [0,TG,2,CM];
        //         Config.codeLinesPerIteration = code.length;
        //         const vm1  = new VM(1);
        //         const org  = vm1.addOrg(0, code);
        //         org.mem    = Int32Array.from([0,2,3,4,5]);
        //         vm1.run();

        //         expect(org.ax).toBe(0);
        //         expect(org.bx).toBe(0);
        //         expect(org.re).toBe(1);
        //         expect(org.code).toEqual(code);
        //         expect(org.line).toEqual(code.length);
        //         expect(org.mem).toEqual(Int32Array.from([0,2,3,4,5]));
        //         vm1.destroy();
        //     });
        //     it('compare two commands not equal values', () => {
        //         const code = [0,1,TG,0,CM];
        //         Config.codeLinesPerIteration = code.length;
        //         const vm1 = new VM(1);
        //         const org = vm1.addOrg(0, code);
        //         org.mem   = Int32Array.from([0,0,2,3,4,5]);
        //         vm1.run();

        //         expect(org.ax).toBe(0);
        //         expect(org.bx).toBe(1);
        //         expect(org.re).toBe(0);
        //         expect(org.code).toEqual(code);
        //         expect(org.line).toEqual(code.length);
        //         expect(org.mem).toEqual(Int32Array.from([0,0,2,3,4,5]));
        //         vm1.destroy();
        //     });
        //     it('compare one command not equal values', () => {
        //         const code = [CM];
        //         Config.codeLinesPerIteration = code.length;
        //         const vm1 = new VM(1);
        //         const org = vm1.addOrg(0, code);
        //         org.mem   = Int32Array.from([1,0,2,3,4,5]);
        //         vm1.run();

        //         expect(org.ax).toBe(0);
        //         expect(org.bx).toBe(0);
        //         expect(org.re).toBe(0);
        //         expect(org.code).toEqual(code);
        //         expect(org.line).toEqual(code.length);
        //         expect(org.mem).toEqual(Int32Array.from([1,0,2,3,4,5]));
        //         vm1.destroy();
        //     });
        // });
    });
});