describe('src/irma/VM', () => {
    const VM        = require('./VM');
    let   Config    = require('./../Config');

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
            orgAmount                  : 20000,
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
        Config = oldConfig;
        vm.destroy();
        vm = null;
    });

    it('Checks VM creation', (done) => {
        vm.ready.then(done);
        expect(true).toBe(true);
    });
});