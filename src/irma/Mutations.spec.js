/* eslint-disable global-require */
describe('src/irma/Mutations', () => {
    const Config    = require('./../Config');
    const WIDTH     = 10;
    const HEIGHT    = 10;
    //
    // This call should be before require('./VM') to setup our 
    // configuration instead of default
    // eslint-disable-next-line no-use-before-define
    _setConfig();

    const Mutations = require('./Mutations');
    const BioVM     = require('./BioVM');

    const CMD_OFFS  = Config.CODE_CMD_OFFS;
    const ADD       = Config.CODE_CMDS.ADD;
    const M         = Config.CODE_8_BIT_MASK;

    let   trunc;
    let   getRand;
    let   randVal;
    let   randI;
    let   randCmd;
    let   vm;

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
            LUCAS                      : [],
            worldZoomSpeed             : 0.1,
            worldFrequency             : 10,
            molAmount                  : 0,
            ORG_MAX_MEM_SIZE           : 32,
            orgMaxAge                  : 2000000,
            codeMutationPercent        : .02,
            codeMutationPeriod         : 2000001,
            orgMaxCodeSize             : 50,
            orgProbs                   : new Uint32Array([10,1,3,1,5,1]),
            molSunPeriod               : 1000,
            molDecayDistance           : 60,
            molCodeSize                : 2,
            energyStepCoef             : 0.01,
            energyMetabolismCoef       : 10000,
            energyDecEveryIteration    : 0
        });
    }

    beforeEach(() => {
        const div = document.createElement('DIV');
        div.id = 'world';
        document.body.appendChild(div);

        randVal     = [0,0,0,1,2,3,4,5];
        randI       = 0;
        randCmd     = CMD_OFFS + 3;
        trunc       = Math.trunc;
        getRand     = Mutations.randCmd;
        vm          = new BioVM({animate: false});

        Math.trunc        = () => randVal[randI++];
        Mutations.randCmd = () => ADD;
    });
    afterEach (() => {
        Math.trunc        = trunc;
        Mutations.randCmd = getRand;
        vm && vm.destroy();
        vm                = null;
        document.body.removeChild(document.body.querySelector('#world'));
    });

    describe('tests of _onChange()', () => {
        it('Checks _onChange() with one atom mol',  () => {
            const org = vm.addOrg(null, 0, new Uint8Array([1|M]), 1000);
            const mol = vm.addMol(1, new Uint8Array([2|M]));
            randVal = [1,0,0,0,0,0,0];
            randI   = 0;
            Mutations._onChange(vm, org.code, org);

            expect(vm.orgsMols.items).toBe(2);
            expect(vm.orgs.items).toBe(1);
            expect(org.code).toEqual(Uint8Array.from([2|M]));
            expect(mol.code).toEqual(Uint8Array.from([1|M]));
        });
        it('Checks _onChange() with two atoms mol',  () => {
            const org = vm.addOrg(null, 0, new Uint8Array([1,2|M]), 1000);
            const mol = vm.addMol(1, new Uint8Array([3,4|M]));
            randVal = [1,1,1,0,0,0,0];
            randI   = 0;
            Mutations._onChange(vm, org.code, org);

            expect(vm.orgsMols.items).toBe(2);
            expect(vm.orgs.items).toBe(1);
            expect(org.code).toEqual(Uint8Array.from([1,4|M]));
            expect(mol.code).toEqual(Uint8Array.from([3,2|M]));
        });
        it('Checks _onChange() with two atoms mol 2',  () => {
            const org = vm.addOrg(null, 0, new Uint8Array([1,2|M]), 1000);
            const mol = vm.addMol(1, new Uint8Array([3|M,4|M]));
            randVal = [1,0,1,0,0,0,0];
            randI   = 0;
            Mutations._onChange(vm, org.code, org);

            expect(vm.orgsMols.items).toBe(2);
            expect(vm.orgs.items).toBe(1);
            expect(org.code).toEqual(Uint8Array.from([4|M,2|M]));
            expect(mol.code).toEqual(Uint8Array.from([3|M,1|M]));
        });
        it('Checks _onChange() with three atoms mol',  () => {
            const org = vm.addOrg(null, 0, new Uint8Array([0,1,2|M]), 1000);
            const mol = vm.addMol(1, new Uint8Array([3|M,4,5|M]));
            randVal = [1,1,2,0,0,0,0];
            randI   = 0;
            Mutations._onChange(vm, org.code, org);

            expect(vm.orgsMols.items).toBe(2);
            expect(vm.orgs.items).toBe(1);
            expect(org.code).toEqual(Uint8Array.from([0,5|M,2|M]));
            expect(mol.code).toEqual(Uint8Array.from([3|M,4,1|M]));
        });
        it('Checks _onChange() with three atoms mol 2',  () => {
            const org = vm.addOrg(null, 0, new Uint8Array([0,1,2|M]), 1000);
            const mol = vm.addMol(1, new Uint8Array([5|M]));
            randVal = [1,1,0,0,0,0,0];
            randI   = 0;
            Mutations._onChange(vm, org.code, org);

            expect(vm.orgsMols.items).toBe(2);
            expect(vm.orgs.items).toBe(1);
            expect(org.code).toEqual(Uint8Array.from([0,5|M,2|M]));
            expect(mol.code).toEqual(Uint8Array.from([1|M]));
        });
    });

    xdescribe('"change" mutation tests', () => {
        it('Checks mutate() method with "change" mutation 1', () => {
            Mutations.mutate(org);
            expect(org.code).toEqual([CMD_OFFS, randCmd]);
        });
        it('Checks mutate() method with "change" mutation 2', () => {
            randVal     = [0,0,2,3,4,5];
            org.probArr = [0,0,2,3,4,5,6,7];

            Mutations.mutate(org);
            expect(org.code).toEqual([randCmd, CMD_OFFS + 1]);
        });
        it('Checks mutate() method with "change" mutation 3', () => {
            org.percent = 1;
            randVal     = [0,0,0,1];
            org.probArr = [0,0,2,3,4,5,6,7];

            Mutations.mutate(org);
            expect(org.code).toEqual([randCmd, randCmd]);
        });
        it('Checks mutate() method with "change" mutation 4', () => {
            org.percent = .1;
            randVal     = [0,0];

            Mutations.mutate(org);
            expect(org.code).toEqual([randCmd, CMD_OFFS + 1]);
        });
    });

    xdescribe('"del" mutation tests', () => {
        it('Checks mutate() method with "del" mutation 1', () => {
            org.probArr = [1,1,2,3,4,5,6,7];
            Mutations.mutate(org);
            expect(org.code).toEqual([CMD_OFFS]);
        });
        it('Checks mutate() method with "del" mutation 2', () => {
            org.probArr = [1,1,2,3,4,5,6,7];
            randVal     = [0,0,2,3,4,5];
            Mutations.mutate(org);
            expect(org.code).toEqual([CMD_OFFS + 1]);
        });
        it('Checks mutate() method with "del" mutation 3', () => {
            org.probArr = [1,1,2,3,4,5,6,7];
            randVal     = [0,0,2,3,4,5];
            org.code    = [];
            Mutations.mutate(org);
            expect(org.code).toEqual([]);
        });
    });

    xdescribe('"period" mutation tests', () => {
        it('Checks mutate() method with "period" mutation 1', () => {
            org.probArr = [2,1,2,3,4,5,6,7];
            Mutations.mutate(org);
            expect(org.period).toEqual(2);
        });
        it('Checks mutate() method with "period" mutation 2', () => {
            org.probArr = [2,1,2,3,4,5,6,7];
            randVal     = [0,0,2,3,4,5];
            Mutations.mutate(org);
            expect(org.period).toEqual(1);
        });
    });

    xdescribe('"percent" mutation tests', () => {
        it('Checks mutate() method with "percent" mutation 1', () => {
            const random = Math.random;
            Math.random = () => .1;
            org.probArr = [3,1,2,3,4,5,6,7];
            Mutations.mutate(org);
            expect(org.percent).toEqual(.1);
            Math.random = random;
        });
        it('Checks mutate() method with "percent" mutation 2', () => {
            const random = Math.random;
            Math.random = () => 0;
            org.probArr = [3,1,2,3,4,5,6,7];
            Mutations.mutate(org);
            expect(org.percent).toEqual(.02);
            Math.random = random;
        });
    });

    xdescribe('"probs" mutation tests', () => {
        it('Checks mutate() method with "probs" mutation 1', () => {
            org.probArr = [4,1,2,3,4,5,6,7];
            randVal     = [0,0,0,3,4,5];
            const probs = org.probs.slice();
            probs[0]    = 1;
            Mutations.mutate(org);
            expect(org.probs).toEqual(probs);
        });
    });
});