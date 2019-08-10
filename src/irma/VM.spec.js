describe('src/irma/VM', () => {
    const VM        = require('./VM');
    let   Config    = require('./../Config');
    const TG        = Config.CODE_CMD_OFFS;
    const SH        = Config.CODE_CMD_OFFS+1;
    const EQ        = Config.CODE_CMD_OFFS+2;
    const PO        = Config.CODE_CMD_OFFS+3;
    const PU        = Config.CODE_CMD_OFFS+4;

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
        expect(org.line).toEqual(org.code.length);
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
        describe('Constants tests', () => {
            it('constant0',  () => run([-1], -1));
            it('constant1',  () => run([0], 0));
            it('constant2',  () => run([1], 1));
            it('constant3',  () => run([2], 2));
            it('constant4',  () => run([1, 2], 2));
            it('constant5',  () => run([1, -1], -1));
            it('constant6',  () => run([1, -1], -1));
            it('constant7',  () => run([0, -1], -1));
            it('constant8',  () => run([-1, -1], -1));
            it('constant9',  () => run([-1, 0, 2], 2));
            it('constant10', () => run([-1, 0, 2], 2));
        });
        describe('toggle tests', () => {
            it('toggle0', () => run([TG]));                           // toggle
            it('toggle1', () => run([TG,TG]));                        // toggle,toggle
            it('toggle2', () => run([1,TG], 0, 1));                   // 1,toggle
            it('toggle2', () => run([TG,1], 1));                      // toggle,1
            it('toggle3', () => run([1,TG,2,TG], 1, 2));              // 1,toggle,2,toggle
            it('toggle4', () => run([1,TG,2,TG,TG], 2, 1));           // 1,toggle,2,toggle,toggle
            it('toggle5', () => run([TG,TG,1,TG,2], 2, 1))            // toggle,toggle,1,toggle,2
            it('toggle6', () => run([1,TG,TG], 1))                    // 1,toggle,toggle
            it('toggle7', () => run([1,TG,TG,TG], 0, 1))              // 1,toggle,toggle,toggle
        });

        describe('shift tests', () => {
            it('shift0', () => run([SH]));                            // shift
            it('shift1', () => run([SH,SH]));                         // shift,shift
            it('shift2', () => run([1,SH]));                          // 1,shift
            it('shift3', () => run([1,SH,SH,SH],1));                  // 1,shift,shift,shift
            it('shift4', () => run([1,SH,2,SH,3,SH],1));              // 1,shift,2,shift,3,shift
            it('shift5', () => run([1,SH,2,SH,3],3));                 // 1,shift,2,shift,3
            it('shift6', () => run([1,SH,2,SH,3,SH,SH],2));           // 1,shift,2,shift,3,shift,shift
        });

        describe('eq tests', () => {
            it('eq0', () => run([EQ]));                               // eq
            it('eq1', () => run([EQ,EQ]));                            // eq,eq
            it('eq2', () => run([1,EQ]));                             // 1,eq
            it('eq3', () => run([1,TG,EQ], 1, 1));                    // 1,toggle,eq
        });

        describe('pop tests', () => {
            it('pop0', () => run([PO]));                              // pop
            it('pop1', () => run([PO,PO]));                           // pop,pop
            it('pop2', () => run([1,PU,0,PO], 1));                    // 1,push,0,pop
            it('pop3', () => run([1,PU,0,PO,PO]));                    // 1,push,0,pop,pop
            it('pop4', () => run([1,PU,PU,0,PO,PO], 1));              // 1,push,push,0,pop,pop
            it('pop4', () => run([1,PU,0,PO,PO,1,PU,0,PO], 1));       // 1,push,0,pop,pop,1,push,0,pop
        });
    });
});

































