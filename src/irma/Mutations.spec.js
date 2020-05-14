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
            codeProbs                   : new Uint32Array([10,1,3,1,5,1]),
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

    describe('tests of _onDel()', () => {
        it('Checks _onDel() with two atoms mol',  () => {
            const org = vm.addOrg(null, 0, new Uint8Array([1,2|M]), 1000);
            randVal = [1,0,0,0,0,0,0];
            randI   = 0;
            Mutations._onDel(vm, org.code, org);
            const mol = vm.orgsMols.get(1);

            expect(vm.orgsMols.items).toBe(2);
            expect(vm.orgs.items).toBe(1);
            expect(org.code).toEqual(Uint8Array.from([1|M]));
            expect(mol.code).toEqual(Uint8Array.from([2|M]));
        });
        it('Checks _onDel() with one atom mol',  () => {
            const org = vm.addOrg(null, 0, new Uint8Array([1|M]), 1000);
            randVal = [0,0,0,0,0,0,0];
            randI   = 0;
            Mutations._onDel(vm, org.code, org);
            const mol = vm.orgsMols.get(0);

            expect(vm.orgsMols.items).toBe(1);
            expect(vm.orgs.items).toBe(0);
            expect(mol.code).toEqual(Uint8Array.from([1|M]));
        });
        it('Checks _onDel() with three atoms mol',  () => {
            const org = vm.addOrg(null, 0, new Uint8Array([1,2,3|M]), 1000);
            randVal = [2,0,0,0,0,0];
            randI   = 0;
            Mutations._onDel(vm, org.code, org);
            const mol = vm.orgsMols.get(1);

            expect(vm.orgsMols.items).toBe(2);
            expect(vm.orgs.items).toBe(1);
            expect(org.code).toEqual(Uint8Array.from([1,2|M]));
            expect(mol.code).toEqual(Uint8Array.from([3|M]));
        });
    })
});