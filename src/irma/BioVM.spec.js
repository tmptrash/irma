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

    const CODE_8_BIT_MASK = Config.CODE_8_BIT_MASK;
    
    const JO        = Config.CODE_CMD_OFFS+37;
    const SP        = Config.CODE_CMD_OFFS+38;

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
            CODE_LUCA                   : [],
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
            molCodeSize                : 8,
            energyStepCoef             : 0.01,
            energyMultiplier           : 10000
        });
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
    function run(code, ax = 0, bx = 0, ret = 0, checkLen = true, lines = null) {
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

            expect(vm1.orgs.size).toBe(Math.round(cfg.molAmount * cfg.molCodeSize / (cfg.CODE_LUCA.length || 1)) + cfg.orgAmount + 1);
            expect(vm1.orgsMols.size).toBe(cfg.orgAmount + cfg.molAmount + 1);
            vm1.destroy();
        });
    });

    describe('Scripts run', () => {
        describe('join tests', () => {
            it('Checks joining right organism',  () => {
                Config.molAmount   = 0;
                Config.orgAmount   = 2;
                Config.CODE_LUCA   = Uint8Array.from([2,JO]);
                Config.molCodeSize = 2;
                Config.codeLinesPerIteration = 2;
                const vm1  = new BioVM();
                const org1 = vm1.orgs.get(0);
                const org2 = vm1.orgs.get(1);

                vm1.world.moveOrg(org2, 0);
                vm1.world.moveOrg(org1, 1);
                org1.compile();
                org2.compile();
                vm1.run();

                expect(vm1.orgs.items).toBe(1);
                expect(org2.code).toEqual(Uint8Array.from([2,JO|CODE_8_BIT_MASK,2,JO|CODE_8_BIT_MASK]));
                vm1.destroy();
            });
            xit('Checks joining empty cell',  () => {
                Config.molAmount = 0;
                Config.orgAmount = 1;
                const vm1  = new VM();
                const org1 = vm1.orgs.get(0);

                vm1.world.moveOrg(org1, 0);
                org1.code = Uint8Array.from([1,AR,2,JO]);
                org1.compile();
                Config.codeLinesPerIteration = org1.code.length;
                vm1.run();
                expect(vm1.orgs.items).toBe(1);
                expect(org1.code).toEqual(Uint8Array.from([1,AR,2,JO]));
                vm1.destroy();
            });
            xit('Checks joining if organism is at the edge of the world',  () => {
                Config.molAmount = 0;
                Config.orgAmount = 1;
                const vm1  = new VM();
                const org1 = vm1.orgs.get(0);

                vm1.world.moveOrg(org1, WIDTH - 1);
                org1.code = [1,AR,2,JO];
                org1.compile();
                Config.codeLinesPerIteration = org1.code.length;
                vm1.run();
                expect(vm1.orgs.items).toBe(1);
                expect(org1.code).toEqual([1,AR,2,JO]);
                vm1.destroy();
            });
            xit('Checks joining right molecule',  () => {
                Config.molAmount = 1;
                Config.orgAmount = 1;
                const vm1  = new VM();
                const org1 = vm1.orgs.get(0);
                const mol1 = vm1.orgsMols.get(0);

                vm1.world.moveOrg(org1, 0);
                vm1.world.moveOrg(mol1, 1);
                org1.code = Uint8Array.from([1,AR,2,JO]);
                mol1.code = Uint8Array.from([5]);
                org1.compile();
                Config.codeLinesPerIteration = org1.code.length;
                vm1.run();
                expect(vm1.orgs.items).toBe(1);
                expect(org1.code).toEqual(Uint8Array.from([1,AR,2,JO,5]));
                expect(vm1.orgsMols.items).toBe(1);
                vm1.destroy();
            });
        })

        xdescribe('split tests', () => {
            it('Checks basic organism splitting',  () => {
                Config.molAmount = 0;
                const vm1  = new VM();
                const org = vm1.orgs.get(0);
                
                vm1.world.moveOrg(org, 0);
                org.code = Uint8Array.from([2,AR,1,TG,0,SP]);
                org.energy = org.code.length * Config.energyMultiplier;
                org.compile();
                Config.codeLinesPerIteration = org.code.length;
                expect(vm1.world.getOrgIdx(1)).toBe(-1);
                expect(vm1.orgsMols.items).toBe(1);
                expect(vm1.orgs.items).toBe(1);
                vm1.run();
                expect(vm1.orgs.items).toBe(1);
                expect(vm1.orgsMols.items).toBe(2); 
                expect(vm1.world.getOrgIdx(1)).not.toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([AR,1,TG,0,SP]));
                vm1.destroy();
            });
            it('Checks organism splitting fail, because position is not free',  () => {
                Config.molAmount = 0;
                Config.orgAmount = 2;
                const vm1  = new VM();
                const org1 = vm1.orgs.get(0);
                const org2 = vm1.orgs.get(1);
                
                vm1.world.moveOrg(org1, 0);
                vm1.world.moveOrg(org2, 1);
                org1.code = Uint8Array.from([2,AR,1,TG,0,SP]);
                org2.code = Uint8Array.from([2]);
                org1.energy = org1.code.length * Config.energyMultiplier;
                org2.energy = org2.code.length * Config.energyMultiplier;
                org1.compile();
                Config.codeLinesPerIteration = org1.code.length;
                expect(vm1.world.getOrgIdx(1)).not.toBe(-1);
                expect(vm1.orgsMols.items).toBe(2);
                expect(vm1.orgs.items).toBe(2);
                vm1.run();
                expect(vm1.orgs.items).toBe(2);
                expect(vm1.orgsMols.items).toBe(2); 
                expect(vm1.world.getOrgIdx(1)).not.toBe(-1);
                expect(org1.offset).toBe(0);
                expect(org2.offset).toBe(1);
                expect(org1.code).toEqual(Uint8Array.from([2,AR,1,TG,0,SP]));
                vm1.destroy();
            });
            it('Checks organism splitting fail, because orgsMols is full',  () => {
                Config.molAmount = 0;
                const vm1  = new VM();
                const org = vm1.orgs.get(0);
                // split to the right
                vm1.world.moveOrg(org, 0);
                org.code = Uint8Array.from([2,2,AR,1,TG,0,SP]);
                org.energy = org.code.length * Config.energyMultiplier;
                org.compile();
                Config.codeLinesPerIteration = org.code.length;
                expect(vm1.world.getOrgIdx(1)).toBe(-1);
                expect(vm1.orgsMols.items).toBe(1);
                expect(vm1.orgs.items).toBe(1);
                vm1.run();
                expect(vm1.orgs.items).toBe(1);
                expect(vm1.orgsMols.items).toBe(2); 
                expect(vm1.world.getOrgIdx(1)).not.toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([2,AR,1,TG,0,SP]));
                // split to the bottom
                org.code[0] = 4;
                vm1.run();
                expect(vm1.orgs.items).toBe(1);
                expect(vm1.orgsMols.items).toBe(2); 
                expect(vm1.world.getOrgIdx(10)).toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([4,AR,1,TG,0,SP]));

                vm1.destroy();
            });
            it('Checks basic organism splitting fail, because out of the world',  () => {
                Config.molAmount = 0;
                const vm1  = new VM();
                const org = vm1.orgs.get(0);
                
                vm1.world.moveOrg(org, 0);
                org.code = Uint8Array.from([0,AR,1,TG,0,SP]);
                org.energy = org.code.length * Config.energyMultiplier;
                org.compile();
                Config.codeLinesPerIteration = org.code.length;
                expect(vm1.world.getOrgIdx(0)).not.toBe(-1);
                expect(vm1.orgsMols.items).toBe(1);
                expect(vm1.orgs.items).toBe(1);
                vm1.run();
                expect(vm1.orgs.items).toBe(1);
                expect(vm1.orgsMols.items).toBe(1); 
                expect(vm1.world.getOrgIdx(0)).not.toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([0,AR,1,TG,0,SP]));
                vm1.destroy();
            });
            it('Checks basic organism splitting fail, because ax < 0',  () => {
                Config.molAmount = 0;
                const vm1  = new VM();
                const org = vm1.orgs.get(0);
                
                vm1.world.moveOrg(org, 0);
                org.code = Uint8Array.from([2,AR,1,TG,1,NT,SP]);
                org.energy = org.code.length * Config.energyMultiplier;
                org.compile();
                Config.codeLinesPerIteration = org.code.length;
                expect(vm1.world.getOrgIdx(1)).toBe(-1);
                expect(vm1.orgsMols.items).toBe(1);
                expect(vm1.orgs.items).toBe(1);
                vm1.run();
                expect(vm1.orgs.items).toBe(1);
                expect(vm1.orgsMols.items).toBe(1); 
                expect(vm1.world.getOrgIdx(1)).toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([2,AR,1,TG,1,NT,SP]));
                vm1.destroy();
            });
            it('Checks basic organism splitting fail, because ax > org.code.length',  () => {
                Config.molAmount = 0;
                const vm1        = new VM();
                const org        = vm1.orgs.get(0);
                
                vm1.world.moveOrg(org, 0);
                org.code = Uint8Array.from([2,AR,1,TG,100,NT,SP]);
                org.energy = org.code.length * Config.energyMultiplier;
                org.compile();
                Config.codeLinesPerIteration = org.code.length;
                expect(vm1.world.getOrgIdx(1)).toBe(-1);
                expect(vm1.orgsMols.items).toBe(1);
                expect(vm1.orgs.items).toBe(1);
                vm1.run();
                expect(vm1.orgs.items).toBe(1);
                expect(vm1.orgsMols.items).toBe(1); 
                expect(vm1.world.getOrgIdx(1)).toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([2,AR,1,TG,100,NT,SP]));
                vm1.destroy();
            });
            it('Checks basic organism splitting fail, because bx < 0',  () => {
                Config.molAmount = 0;
                const vm1  = new VM();
                const org = vm1.orgs.get(0);
                
                vm1.world.moveOrg(org, 0);
                org.code = Uint8Array.from([2,AR,1,NT,TG,1,SP]);
                org.energy = org.code.length * Config.energyMultiplier;
                org.compile();
                Config.codeLinesPerIteration = org.code.length;
                expect(vm1.world.getOrgIdx(1)).toBe(-1);
                expect(vm1.orgsMols.items).toBe(1);
                expect(vm1.orgs.items).toBe(1);
                vm1.run();
                expect(vm1.orgs.items).toBe(1);
                expect(vm1.orgsMols.items).toBe(1); 
                expect(vm1.world.getOrgIdx(1)).toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([2,AR,1,NT,TG,1,SP]));
                vm1.destroy();
            });
            it('Checks basic organism cloning',  () => {
                Config.molAmount = 0;
                const vm1        = new VM();
                const org        = vm1.orgs.get(0);
                
                vm1.world.moveOrg(org, 10);
                org.code = Uint8Array.from([1,AR,Config.CODE_ORG_ID,PU,1,TG,0,SP,PO]);
                org.energy = org.code.length * Config.energyMultiplier;
                org.compile();
                Config.codeLinesPerIteration = org.code.length;
                expect(vm1.world.getOrgIdx(1)).toBe(-1);
                expect(vm1.orgsMols.items).toBe(1);
                expect(vm1.orgs.items).toBe(1);
                vm1.run();
                expect(vm1.orgs.items).toBe(2);
                expect(vm1.orgsMols.items).toBe(2); 
                expect(vm1.orgs.get(1).energy).toBe(true); 
                expect(vm1.world.getOrgIdx(1)).not.toBe(-1);
                expect(org.code).toEqual(Uint8Array.from([AR,Config.CODE_ORG_ID,PU,1,TG,0,SP,PO]));
                expect(vm1.orgs.get(1).code).toEqual(Uint8Array.from([1]));
                vm1.destroy();
            });
        });

        xdescribe('find tests', () => {
            it('find0',  () => run([FI]));
            it('find one toggle command between offsets 7 and 11',  () => run([11,TG,7,LI, 191,TG,1,AD,TG,0,NT,TG, FI], 8, -1, 1));
            it('find one toggle command between offsets 0 and 3',   () => run([3,TG,0,LI,  191,TG,1,AD,TG,0,NT,TG, FI], 1, -1, 1));
            it('can not find one eq command',                       () => run([30,TG,0,LI, 191,TG,2,AD,TG,0,NT,TG, FI], 193, -1, 0));
        });
    });
});