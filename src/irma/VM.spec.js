describe('src/irma/VM', () => {
    const VM        = require('./VM');
    let   Config    = require('./../Config');
    const CMD_OFFS  = Config.CODE_CMD_OFFS;

    const WIDTH     = 10;
    const HEIGHT    = 10;

    let   oldConfig = JSON.parse(JSON.stringify(Config)); // Config copy
    let   vm        = null;

    beforeEach(() => {
        Object.assign(Config, {
            DIR                        : new Int32Array([-WIDTH, -WIDTH + 1, 1, WIDTH + 1, WIDTH, WIDTH - 1, -1, -WIDTH - 1]),
            CODE_CMD_OFFS              : 1024,
            CODE_COMMANDS              : 50,
            CODE_STACK_SIZE            : 100,
            codeLinesPerIteration      : 1,
            codeTimesPerRun            : 1,
            codeMutateEveryClone       : 1000,
            codeRegs                   : 6,
            codeKillTimes              : 3,
            codeLuca                   : [],
            WORLD_WIDTH                : WIDTH,
            WORLD_HEIGHT               : HEIGHT,
            worldFrequency             : 10,
            DB_ON                      : false,
            DB_CHUNK_SIZE              : 100,
            energyValue                : .5,
            ORG_PROB_MAX_VALUE         : 50,
            ORG_MASK                   : 0x80000000,
            ORG_MIN_COLOR              : 0x96,
            orgAmount                  : 1,
            orgMaxAge                  : 2000000,
            orgEnergy                  : 49,
            orgStepEnergy              : .001,
            orgEnergyPeriod            : 0,
            orgColor                   : 0xff0000,
            orgMutationPercent         : .02,
            orgMutationPeriod          : 2000001,
            orgMaxCodeSize             : 256,
            orgMoleculeCodeSize        : 8,
            orgProbs                   : new Uint32Array([10,1,2,3,1,5,1,1]),
            ageJoin                    : 10,
            ageMove                    : 20
        });

        vm = new VM();
    });

    afterEach(() => {
        Object.assign(Config, oldConfig);
        vm.destroy();
        vm = null;
    });

    //
    // Runs one script from single organism and checks registers on finish
    //
    function run(code, ax = 0, bx = 0, ret = 0) {
        Config.codeLinesPerIteration = code.length;
        const org = vm._orgs.added();
        org.code  = code.slice(); // code copy
        expect(org.ax).toBe(0);
        expect(org.bx).toBe(0);
        expect(org.ret).toBe(0);
        expect(org.line).toBe(0);
        vm.run();
        expect(org.ax).toBe(ax);
        expect(org.bx).toBe(bx);
        expect(org.ret).toBe(ret);
        expect(org.code).toEqual(code);
    }

    describe('VM creation', () => {
        it('Checks VM creation', (done) => {
            vm.ready.then(done);
        });

        it('Checks amount of created organisms', () => {
            expect(vm._orgs.items).toBe(Config.orgAmount);
        });
    });

    describe('Scripts run', () => {
        it('constant',  () => run([1], 1));
        it('constant1', () => run([2], 2));
        it('constant2', () => run([1,2], 2));
        it('toggle',    () => run([1, CMD_OFFS, 2, CMD_OFFS], 1, 2));
    });
});