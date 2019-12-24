/* eslint-disable global-require */
describe('src/irma/VM', () => {
    const Config    = require('./../Config');
    const oldConfig = JSON.parse(JSON.stringify(Config)); // Config copy
    const WIDTH     = 10;
    const HEIGHT    = 10;
    //
    // This call should be before require('./VM') to setup our 
    // configuration instead of default
    // eslint-disable-next-line no-use-before-define
    _setConfig();
    const BioVM     = require('./BioVM');

    const MASK      = Config.CODE_8_BIT_MASK;
    
    const TG        = Config.CODE_CMD_OFFS;
    const EQ        = Config.CODE_CMD_OFFS+1;
    const NO        = Config.CODE_CMD_OFFS+2;
    const AD        = Config.CODE_CMD_OFFS+3;
    const SU        = Config.CODE_CMD_OFFS+4;
    const MU        = Config.CODE_CMD_OFFS+5;
    const DI        = Config.CODE_CMD_OFFS+6;
    const IN        = Config.CODE_CMD_OFFS+7;
    const DE        = Config.CODE_CMD_OFFS+8;
    const RS        = Config.CODE_CMD_OFFS+9;
    const LS        = Config.CODE_CMD_OFFS+10;
    const RA        = Config.CODE_CMD_OFFS+11;
    const FP        = Config.CODE_CMD_OFFS+12;
    const FN        = Config.CODE_CMD_OFFS+13;
    const FZ        = Config.CODE_CMD_OFFS+14;
    const FG        = Config.CODE_CMD_OFFS+15;
    const FL        = Config.CODE_CMD_OFFS+16;
    const FE        = Config.CODE_CMD_OFFS+17;
    const FNE       = Config.CODE_CMD_OFFS+18;
    const LP        = Config.CODE_CMD_OFFS+19;
    const CA        = Config.CODE_CMD_OFFS+20;
    const FU        = Config.CODE_CMD_OFFS+21;
    const RE        = Config.CODE_CMD_OFFS+22;
    const EN        = Config.CODE_CMD_OFFS+23;
    const RX        = Config.CODE_CMD_OFFS+24;
    const AR        = Config.CODE_CMD_OFFS+25;
    const AN        = Config.CODE_CMD_OFFS+26;
    const OR        = Config.CODE_CMD_OFFS+27;
    const XO        = Config.CODE_CMD_OFFS+28;
    const NT        = Config.CODE_CMD_OFFS+29;
    const AG        = Config.CODE_CMD_OFFS+30;
    const LI        = Config.CODE_CMD_OFFS+31;
    const LE        = Config.CODE_CMD_OFFS+32;
    const LF        = Config.CODE_CMD_OFFS+33;
    const RI        = Config.CODE_CMD_OFFS+34;
    const SA        = Config.CODE_CMD_OFFS+35;
    const LO        = Config.CODE_CMD_OFFS+36;

    const JO        = Config.CODE_CMD_OFFS+37;
    const SP        = Config.CODE_CMD_OFFS+38;
    const ST        = Config.CODE_CMD_OFFS+39;
    const SE        = Config.CODE_CMD_OFFS+40;

    const OF        = Config.CODE_CMD_OFFS+47;
    const CO        = Config.CODE_CMD_OFFS+48;
    const AB        = Config.CODE_CMD_OFFS+49;
    const CB        = Config.CODE_CMD_OFFS+50;
    const FI        = Config.CODE_CMD_OFFS+51;
    const MO        = Config.CODE_CMD_OFFS+52;
    const ML        = Config.CODE_CMD_OFFS+53;

    let   vm        = null;

    /**
     * Setup default config for tests
     */
    function _setConfig() {
        Object.assign(Config, {
            // constants
            DIR                        : new Int32Array([-WIDTH, -WIDTH + 1, 1, WIDTH + 1, WIDTH, WIDTH - 1, -1, -WIDTH - 1]),
            DB_ON                      : false,
            WORLD_WIDTH                : WIDTH,
            WORLD_HEIGHT               : HEIGHT,
            PLUGINS                    : [],
            // variables
            codeLinesPerIteration      : 1,
            codeRepeatsPerRun          : 1,
            codeMutateEveryClone       : 1000,
            codeMutateMutations        : false,
            LUCAS                      : [{code: [], offs: 0, energy: 10000}],
            worldZoomSpeed             : 0.1,
            worldFrequency             : 10,
            molAmount                  : 1,
            orgAmount                  : 1,
            orgMaxAge                  : 2000000,
            orgMutationPercent         : .02,
            orgMutationPeriod          : 2000001,
            orgMaxCodeSize             : 50,
            orgMaxMemSize              : 128,
            orgProbs                   : new Uint32Array([10,1,3,1,5,1,1]),
            molDecayPeriod             : 1000,
            molDecayDistance           : 60,
            molCodeSize                : 2,
            energyStepCoef             : 0.01,
            energyMultiplier           : 10000
        });
    }

    /**
     * Runs one script from single organism and checks registers on finish
     * @param {Array} code Array of codes of organisms and molecules
     * @param {Object} cfg Test configuration
     * @param {Array} move Array of offsets of organisms and molecules
     */
    function run(code, cfg, move) {
        Config.codeLinesPerIteration = code[0].length;
        Object.assign(Config, cfg);
        Object.assign(Config, {LUCAS: [{code: Uint8Array.from([0])}]});
        vm  = new BioVM();
        for (let i = 0; i < move.length; i++) {
            vm.orgsMols.get(i).code = vm.split2Mols(Uint8Array.from(code[i]).slice());
            vm.world.moveOrg(vm.orgsMols.get(i), move[i]);
            vm.orgsMols.get(i).hasOwnProperty('energy') && vm.orgsMols.get(i).compile();
        }

        expect(vm.orgs.items).toBe(Config.orgAmount);
        expect(vm.orgsMols.items).toBe(Config.molAmount + Config.orgAmount);
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
        org.compile();

        expect(org.ax).toBe(0);
        expect(org.bx).toBe(0);
        expect(org.ret).toBe(0);
        expect(org.line).toBe(0);
        vm.run();

        expect(org.ax).toBe(ax);
        expect(org.bx).toBe(bx);
        expect(org.ret).toBe(ret);
        expect(org.code).toEqual(Uint8Array.from(code));
        checkLen && expect(org.line).toEqual(org.code.length);
    }    

    beforeEach(() => {
        _setConfig();
        vm = new BioVM();
    });

    afterEach(() => {
        Object.assign(Config, oldConfig);
        vm.destroy();
        vm = null;
    });

    describe('BioVM creation', () => {
        it('Checks BioVM creation', () => {
            const vm1 = new BioVM();
            const cfg = Config;

            expect(vm1.orgs.size).toBe(Math.round(cfg.molAmount * cfg.molCodeSize / (cfg.LUCAS[0].code.length || 1)) + cfg.orgAmount + 1);
            expect(vm1.orgsMols.size).toBe(cfg.orgAmount + cfg.molAmount + 1);
            vm1.destroy();
        });
    });

    describe('Scripts run', () => {
        xdescribe('join tests', () => {
            it('Checks joining right organism',  () => {
                run([[2,JO],[2,JO]], {molAmount: 0, orgAmount: 2}, [1,0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2,JO|MASK,2,JO|MASK]));
                expect(vm.orgs.get(0).energy).toEqual(2 * Config.energyMultiplier - 2);
            });
            it('Checks joining empty cell',  () => {
                run([[2,JO],[2,JO]], {molAmount: 0, orgAmount: 1}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2,JO|MASK]));
            });
            it('Checks joining if organism is at the edge of the world',  () => {
                run([[2,JO]], {molAmount: 0, orgAmount: 1}, [WIDTH-1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2,JO|MASK]));
            });
            it('Checks joining right molecule',  () => {
                Config.molAmount   = 1;
                Config.orgAmount   = 1;
                Config.LUCAS[0].code = Uint8Array.from([2,JO]);
                Config.molCodeSize = 2;
                Config.codeLinesPerIteration = 2;
                const vm1  = new BioVM();
                const org1 = vm1.orgs.get(0);
                const mol1 = vm1.orgsMols.get(1);
                const mol1Copy = mol1.code.slice();

                vm1.world.moveOrg(org1, 0);
                vm1.world.moveOrg(mol1, 1);

                expect(vm1.orgs.items).toBe(1);
                expect(vm1.orgsMols.items).toBe(2);
                vm1.run();

                expect(vm1.orgs.items).toBe(1);
                expect(vm1.orgsMols.items).toBe(1);
                expect(org1.code).toEqual(Uint8Array.from([2,JO|MASK]).push(mol1Copy));
                vm1.destroy();
            });
        })

        xdescribe('split tests', () => {
            it('Checks basic organism splitting',  () => {
                run([[2,AR,1,TG,0,SP]], {molAmount: 0, orgAmount: 1}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([1,TG|MASK,0,SP|MASK]));
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('Checks organism splitting fail, because position is not free',  () => {
                run([[2],[2,AR,1,TG,0,SP]], {molAmount: 0, orgAmount: 2}, [1,0]);

                expect(vm.orgs.items).toBe(2);
                expect(vm.orgsMols.items).toBe(2); 
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).offset).toBe(1);
                expect(vm.orgs.get(1).offset).toBe(0);
                expect(vm.orgs.get(1).code).toEqual(Uint8Array.from([2,AR|MASK,1,TG|MASK,0,SP|MASK]));
            });
            it('Checks organism splitting fail, because orgsMols is full',  () => {
                Config.molAmount = 0;
                Config.LUCAS[0].code = Uint8Array.from([2,2,2,2,AR,1,TG,0,SP]);
                const vm1  = new BioVM();
                const org = vm1.orgs.get(0);
                vm1.world.moveOrg(org, 0);
                Config.codeLinesPerIteration = org.code.length;

                expect(vm1.world.index(1)).toBe(-1);
                expect(vm1.orgsMols.items).toBe(1);
                expect(vm1.orgs.items).toBe(1);
                // split to the right
                vm1.run();

                expect(vm1.orgs.items).toBe(1);
                expect(vm1.orgsMols.items).toBe(2); 
                expect(vm1.world.index(1)).not.toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([2,2|MASK,AR,1|MASK,TG,0|MASK,SP|MASK]));
                // split to the bottom
                org.code[1] = 4|MASK;
                vm1.run();

                expect(vm1.orgs.items).toBe(1);
                expect(vm1.orgsMols.items).toBe(2); // 2, not 3, because orgsMols is full
                expect(vm1.world.index(10)).toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([2,4|MASK,AR,1|MASK,TG,0|MASK,SP|MASK]));

                vm1.destroy();
            });
            it('Checks basic organism splitting fail, because out of the world',  () => {
                run([[0,AR,1,TG,0,SP]], {molAmount: 0, orgAmount: 1}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(1)).toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([0,AR|MASK,1,TG|MASK,0,SP|MASK]));
            });
            it('Checks basic organism splitting not fail, because ax < 0',  () => {
                run([[2,AR,1,TG,0,NT,SP]], {molAmount: 0, orgAmount: 1}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([1,TG|MASK,0,NT|MASK,SP|MASK]));
            });
            it('Checks basic organism splitting not fail, because bx > molAmount',  () => {
                run([[2,AR,10,TG,1,SP]], {molAmount: 0, orgAmount: 1}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2,AR|MASK,1,SP|MASK]));
            });
            it('Checks basic organism splitting not fail, because ax > molAmount',  () => {
                run([[2,AR,20,TG,0,SP]], {molAmount: 0, orgAmount: 1}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([0,SP|MASK]));
            });
            it('Checks basic organism splitting fail, because bx < ax',  () => {
                run([[2,AR,0,TG,1,SP]], {molAmount: 0, orgAmount: 1}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(1)).toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2,AR|MASK,0,TG|MASK,1,SP|MASK]));
            });
            it('Checks basic organism cloning',  () => {
                run([[Config.CODE_ORG_ID,AR,1,TG,0,SP]], {molAmount: 0, orgAmount: 1}, [WIDTH+2]);

                expect(vm.orgs.items).toBe(2);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.world.index(3)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([1,TG|MASK,0,SP|MASK]));
            });
        });

        xdescribe('step tests', () => {
            it('Checks step up', () => {
                run([[0,ST]], {molAmount: 0, orgAmount: 1}, [WIDTH]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([0,ST|MASK]));
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('Checks step up-right', () => {
                run([[1,ST]], {molAmount: 0, orgAmount: 1}, [WIDTH]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([1,ST|MASK]));
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('Checks step right', () => {
                run([[2,ST]], {molAmount: 0, orgAmount: 1}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2,ST|MASK]));
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('Checks step right-down', () => {
                run([[3,ST]], {molAmount: 0, orgAmount: 1}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(WIDTH+1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([3,ST|MASK]));
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('Checks step down', () => {
                run([[4,ST]], {molAmount: 0, orgAmount: 1}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(WIDTH)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([4,ST|MASK]));
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('Checks step down-left', () => {
                run([[5,ST]], {molAmount: 0, orgAmount: 1}, [1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(WIDTH)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([5,ST|MASK]));
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('Checks step left', () => {
                run([[6,ST]], {molAmount: 0, orgAmount: 1}, [1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([6,ST|MASK]));
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('Checks step left-up', () => {
                run([[7,ST]], {molAmount: 0, orgAmount: 1}, [WIDTH+1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([7,ST|MASK]));
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('Checks step outside up (cyclical world)', () => {
                run([[0,ST]], {molAmount: 0, orgAmount: 1}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(0)).toBe(-1);
                expect(vm.world.index(WIDTH * HEIGHT - WIDTH)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([0,ST|MASK]));
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('Checks step outside down (cyclical world)', () => {
                run([[4,ST]], {molAmount: 0, orgAmount: 1}, [WIDTH * HEIGHT - WIDTH]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(0)).not.toBe(-1);
                expect(vm.world.index(WIDTH * HEIGHT - WIDTH)).toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([4,ST|MASK]));
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('Checks step outside left (cyclical world)', () => {
                run([[6,ST]], {molAmount: 0, orgAmount: 1}, [WIDTH]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(WIDTH)).toBe(-1);
                expect(vm.world.index(WIDTH-1)).not.toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([6,ST|MASK]));
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('Checks step outside right (cyclical world)', () => {
                run([[2,ST]], {molAmount: 0, orgAmount: 1}, [WIDTH-1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.world.index(WIDTH)).not.toBe(-1);
                expect(vm.world.index(WIDTH-1)).toBe(-1);
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2,ST|MASK]));
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
        });

        xdescribe('see tests', () => {
            it('see right on other organism', () => {
                run([[1,SE],[2]], {molAmount: 1, orgAmount: 1}, [0,1]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.orgs.get(0).ax).toEqual(2);
            })
            it('see right on empty cell', () => {
                run([[1,SE]], {molAmount: 0, orgAmount: 1}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).ax).toEqual(0);
            })
            it('see left out of the world', () => {
                run([[0,NT,SE]], {molAmount: 0, orgAmount: 1}, [0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(1);
                expect(vm.orgs.get(0).ax).toEqual(0);
            })
            it('see up on molecule', () => {
                run([[WIDTH-1,NT,SE],[3]], {molAmount: 1, orgAmount: 1}, [WIDTH,0]);

                expect(vm.orgs.items).toBe(1);
                expect(vm.orgsMols.items).toBe(2);
                expect(vm.orgs.get(0).ax).toEqual(3);
            })
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
                const energy = Config.energyMultiplier * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                org.compile();
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([1,TG,0,AB|MASK]));
                expect(vm.orgs.get(0).energy).toEqual(energy - (code.length * Config.energyMultiplier) - 1);
            });
            it('anabolism of one molecule only', () => {
                const code   = vm.split2Mols(Uint8Array.from([AB]));
                const energy = Config.energyMultiplier * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                org.compile();
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([AB|MASK]));
                expect(vm.orgs.get(0).energy).toEqual(energy - 1);
                expect(vm.orgs.get(0).ret).toEqual(0);
            });
            it('joining two molecules from different places', () => {
                const code   = vm.split2Mols(Uint8Array.from([2,TG,0,0,0,AB]));
                const energy = Config.energyMultiplier * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                org.compile();
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2,TG,0,AB|MASK,0,0|MASK]));
                expect(vm.orgs.get(0).energy).toEqual(energy - (4 * Config.energyMultiplier) - 1);
            });
            it('joining two molecules when ax < 0', () => {
                const code   = vm.split2Mols(Uint8Array.from([2,TG,0,0,0,NT,AB]));
                const energy = Config.energyMultiplier * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                org.compile();
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([2,TG,0,NT|MASK,0,0|MASK,AB|MASK]));
                expect(vm.orgs.get(0).energy).toEqual(energy - (4 * Config.energyMultiplier) - 1);
            });
            it('joining two molecules when bx > molAmount', () => {
                const code   = vm.split2Mols(Uint8Array.from([20,TG,0,0,0,AB]));
                const energy = Config.energyMultiplier * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                org.compile();
                org.energy = energy;
                vm.run();

                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([20,TG,0,AB|MASK,0,0|MASK]));
                expect(vm.orgs.get(0).energy).toEqual(energy - 4 * Config.energyMultiplier - 1);
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
        });

        xdescribe('catab tests', () => {
            it('simple catabolism', () => {
                const code   = vm.split2Mols(Uint8Array.from([0,CB]));
                const energy = Config.energyMultiplier * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                org.compile();
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([0|MASK,CB|MASK]));
                expect(vm.orgs.get(0).energy).toEqual(energy + (code.length * Config.energyMultiplier) - 1);
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('simple catabolism with longer molecule', () => {
                const code   = vm.split2Mols(Uint8Array.from([0,1,2,3,4,1,CB]));
                const energy = Config.energyMultiplier * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                org.compile();
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([0,1|MASK,2|MASK,3|MASK,4,1|MASK,CB|MASK]));
                expect(vm.orgs.get(0).energy).toEqual(energy + (2 * Config.energyMultiplier) - 1);
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('catabolism if ax < 0', () => {
                const code   = vm.split2Mols(Uint8Array.from([1,NT,CB]));
                const energy = Config.energyMultiplier * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                org.compile();
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([1|MASK,NT|MASK,CB|MASK]));
                expect(vm.orgs.get(0).energy).toEqual(energy + (2 * Config.energyMultiplier) - 1);
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
            it('catabolism if ax > molAmount', () => {
                const code   = vm.split2Mols(Uint8Array.from([10,CB]));
                const energy = Config.energyMultiplier * 10;
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = code.slice(); // code copy
                org.compile();
                org.energy = energy;
                vm.run();
        
                expect(vm.orgs.get(0).code).toEqual(Uint8Array.from([10|MASK,CB|MASK]));
                expect(vm.orgs.get(0).energy).toEqual(energy + 2 * Config.energyMultiplier - 1);
                expect(vm.orgs.get(0).ret).toEqual(1);
            });
        });

        xdescribe('find tests', () => {
            it('find molecule [3,AR] at the end',     () => run2(vm.split2Mols([3,AR,1,TG,FI,0,3,AR]), 3, 1, 3));
            it('find molecule [3] at the middle',     () => run2([3|MASK,AR|MASK,3|MASK,1,TG,FI|MASK], 2, 1, 1));
            it('find molecule [0] at the beginning',  () => run2([0|MASK,4,AR|MASK,0,FI|MASK], 0, 0, 1));
            it('find molecule [0,1] at the end',      () => run2([0,1|MASK,4,AR|MASK,1,TG,0,FI|MASK,0,1|MASK], 3, 1, 1));
            it('should not find molecule [0]',        () => run2([0|MASK,4,AR|MASK,1,FI|MASK], 1, 0, 0));
        });

        xdescribe('move tests', () => {
            it('move first molecule to the center', () => {
                const code = Uint8Array.from([0,1,2,2,TG,MO]);
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = vm.split2Mols(code);
                org.compile();
                vm.run();
        
                expect(org.ax).toBe(0);
                expect(org.bx).toBe(2);
                expect(org.ret).toBe(1);
                expect(org.code).toEqual(Uint8Array.from([2,2|MASK,0,1|MASK,TG,MO|MASK]));
            });
            it('move first molecule with bx > molAmount', () => {
                const code = Uint8Array.from([0,1,2,5,TG,MO]);
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = vm.split2Mols(code);
                org.compile();
                vm.run();
        
                expect(org.ax).toBe(0);
                expect(org.bx).toBe(5);
                expect(org.ret).toBe(1);
                expect(org.code).toEqual(Uint8Array.from([2,5|MASK,0,1|MASK,TG,MO|MASK]));
            });
            it('move first molecule with ax < 0', () => {
                const code = Uint8Array.from([0,1,2,5,TG,0,NT,MO]);
                Config.molAmount = 0;
                Config.orgAmount = 1;
                Config.codeLinesPerIteration = code.length;
                const org = vm.orgs.get(0);
                org.code  = vm.split2Mols(code);
                org.compile();
                vm.run();
        
                expect(org.ax).toBe(-1);
                expect(org.bx).toBe(5);
                expect(org.ret).toBe(1);
                expect(org.code).toEqual(Uint8Array.from([2,5|MASK,TG,0|MASK,0,1|MASK,NT,MO|MASK]));
            });
        });

        xdescribe('mols tests', () => {
            it('mols0', () => run2([0|MASK,1,ML|MASK], 2));
            it('mols1', () => run2([ML|MASK], 1));
            it('mols2', () => run2([ML], 1));
        });
    });
});