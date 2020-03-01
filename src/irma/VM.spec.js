/* eslint-disable global-require */
describe('src/irma/VM', () => {
    const Config    = require('./../Config');
    const WIDTH     = 10;
    const HEIGHT    = 10;
    //
    // This call should be before require('./VM') to setup our 
    // configuration instead of default
    // eslint-disable-next-line no-use-before-define
    _setConfig();

    const Compiler  = require('./Compiler');
    const oldConfig = JSON.parse(JSON.stringify(Config)); // Config copy
    const VM        = require('./VM');
    
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
    const SAA       = Config.CODE_CMDS.SAVEA;
    const LOA       = Config.CODE_CMDS.LOADA;
    const RD        = Config.CODE_CMDS.READ;
    const BR        = Config.CODE_CMDS.BREAK;

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
            LUCAS                      : [{code: Uint8Array.from([])}],
            // variables
            codeLinesPerIteration      : 1,
            codeRepeatsPerRun          : 1,
            codeMutateEveryClone       : 1000,
            codeMutateMutations        : false,
            worldZoomSpeed             : 0.1,
            worldFrequency             : 10,
            molAmount                  : 1,
            ORG_MAX_MEM_SIZE           : 16,
            orgMaxAge                  : 2000000,
            orgMutationPercent         : .02,
            orgMutationPeriod          : 2000001,
            orgMaxCodeSize             : 50,
            orgProbs                   : new Uint32Array([10,1,3,1,5,1,1]),
            molDecayPeriod             : 1000,
            molDecayDistance           : 60,
            molCodeSize                : 8,
            energyStepCoef             : 0.01,
            energyMetabolismCoef       : 10000
        });
    }

    /**
     * Runs one script from single organism and checks registers on finish
     * @param {Uint8Array} code Code to run
     * @param {Number} ax ax register should be equal this value after run
     * @param {Number} bx bx register should be equal this value after run
     * @param {Boolean} checkLen If true, then org.code.length === lines
     * @param {Number} lines Amount of lines run after calling vm.run()
     */
    function run(code, ax = 0, bx = 0, checkLen = true, lines = null) {
        Config.codeLinesPerIteration = lines === null ? code.length : lines;
        const org = vm.orgs.get(0);
        org.code  = Uint8Array.from(code).slice(); // code copy
        Compiler.compile(org);

        expect(org.ax).toBe(0);
        expect(org.bx).toBe(0);
        expect(org.line).toBe(0);
        vm.run();

        expect(org.ax).toBe(ax);
        expect(org.bx).toBe(bx);
        expect(org.code).toEqual(Uint8Array.from(code));
        checkLen && expect(org.line).toEqual(org.code.length);
    }

    beforeEach(() => {
        _setConfig();
        vm = new VM(1);
        vm.addOrg(0, new Uint8Array());
    });

    afterEach(() => {
        Object.assign(Config, oldConfig);
        vm.destroy();
        vm = null;
    });

    describe('VM creation', () => {
        it('Checks VM creation', () => {
            const orgs = 1;
            const vm1  = new VM(orgs);
            
            expect(vm1.orgs.size).toBe(orgs);
            expect(vm1.population).toBe(0);
            expect(vm1.iteration).toBe(0);
        });
    });

    describe('Scripts run', () => {
        describe('Constants tests', () => {
            it('constant0',  () => run([0]));
            it('constant1',  () => run([1], 1));
            it('constant2',  () => run([3], 3));
            it('constant3',  () => run([0], 0));
            it('constant4',  () => run([1], 1));
            it('constant5',  () => run([2], 2));
            it('constant6',  () => run([1, 2], 2));
            it('constant7',  () => run([1, DE, DE], -1));
            it('constant8',  () => run([1, 2, 1], 1));
            it('constant9',  () => run([0, 1], 1));
            it('constant10', () => run([1, 1], 1));
            it('constant11', () => run([1, 0, 2], 2));
            it('constant12', () => run([1, 3, 2], 2));
            it('constant13', () => run([IN,10], 10));
            it('constant14', () => run([IN,10,IN], 11));
        });

        describe('toggle tests', () => {
            it('toggle0',  () => run([TG]));
            it('toggle1',  () => run([TG,TG]));
            it('toggle2',  () => run([1,TG], 0, 1));
            it('toggle3',  () => run([TG,1], 1));
            it('toggle4',  () => run([1,TG,2,TG], 1, 2));
            it('toggle5',  () => run([1,TG,2,TG,TG], 2, 1));
            it('toggle6',  () => run([TG,TG,1,TG,2], 2, 1));
            it('toggle7',  () => run([1,TG,TG], 1));
            it('toggle8',  () => run([1,TG,TG,TG], 0, 1));
            it('toggle9',  () => run([1,TG,1,NA,TG,0,DE,TG], -2, -1));
            it('toggle10', () => run([1,TG,1,NA,TG,1,TG], -2, 1));
            it('toggle11', () => run([1,TG,2,Config.CODE_CMD_OFFS], 1, 2));
            it('toggle12', () => run([1,TG,2], 2, 1));
            it('toggle13', () => run([1,TG,TG,TG,TG,TG], 0, 1));
            it('toggle14', () => run([1,TG,TG,2,TG,TG,TG], 0, 2));
        });

        describe('eq tests', () => {
            it('eq0', () => run([EQ]));
            it('eq1', () => run([EQ,EQ]));
            it('eq2', () => run([1,EQ]));
            it('eq3', () => run([1,TG,EQ], 1, 1));
            it('eq4', () => run([0,DE,TG,EQ], -1, -1));
        });

        describe('nop tests', () => {
            it('nop0', () => run([NO]));
            it('nop1', () => run([NO,NO,NO]));
            it('nop2', () => run([1,NO], 1));
            it('nop3', () => run([NO,1,NO], 1));
            it('nop4', () => run([2,LP,NO,EN], 2, 0, false, 7));
            it('nop5', () => run([1,IN,NO,IN], 3));
        });

        describe('add tests', () => {
            it('add0', () => run([AD]));
            it('add1', () => run([1,TG,2,AD], 3, 1));
            it('add2', () => run([1,TG,0,AD], 1, 1));
            it('add3', () => run([1,TG,AD,AD], 2, 1));
            it('add4', () => run([1,TG,2,AD], 3, 1));
            it('add5', () => run([DE,TG,2,AD], 1, -1));
            it('add6', () => run([1,TG,1,AD,AD], 3, 1));
        });

        describe('sub tests', () => {
            it('sub0', () => run([SU]));
            it('sub1', () => run([1,TG,2,SU], 1, 1));
            it('sub2', () => run([1,TG,SU], -1, 1));
            it('sub3', () => run([0,DE,TG,EQ,SU], 0, -1));
            it('sub4', () => run([3,TG,1,SU], -2, 3));
        });

        describe('mul tests', () => {
            it('mul0', () => run([MU]));
            it('mul1', () => run([2,TG,3,MU], 6, 2));
            it('mul2', () => run([1,TG,MU], 0, 1));
            it('mul3', () => run([0,DE,TG,MU], 0, -1));
            it('mul4', () => run([DE,DE,TG,EQ,MU], 4, -2));
            it('mul5', () => run([1,TG,2,MU], 2, 1));
        });

        describe('div tests', () => {
            it('div0', () => run([DI], -Number.MAX_VALUE));
            it('div1', () => run([3,TG,2,DI], 1, 3));
            it('div2', () => run([1,TG,DI], 0, 1));
            it('div3', () => run([DE,TG,DI], 0, -1));
            it('div4', () => run([DE,DE,DE,TG,1,DE,DE,DE,DI], 1, -3));
            it('div5', () => run([1,TG,2,DI], 2, 1));
            it('div6', () => run([2,TG,DE,DI], 0, 2));
            it('div7', () => run([2,DI], -Number.MAX_VALUE));
            it('div8', () => run([5,TG,10,DI], 2, 5));
        });

        describe('inc tests', () => {
            it('inc0', () => run([IN], 1));
            it('inc1', () => run([2,IN], 3));
            it('inc2', () => run([2,IN,IN,IN], 5));
            it('inc3', () => run([2,IN,IN,2,IN], 3));
            it('inc4', () => run([DE,DE,IN], -1));
            it('inc5', () => run([1,IN], 2));
            it('inc6', () => run([DE,IN]));
        });

        describe('dec tests', () => {
            it('dec0', () => run([DE], -1));
            it('dec1', () => run([2,DE], 1));
            it('dec2', () => run([2,DE,DE,DE], -1));
            it('dec3', () => run([2,DE,DE,2,DE], 1));
            it('dec4', () => run([DE,DE,DE], -3));
            it('dec5', () => run([1,DE]));
        });

        describe('rshift tests', () => {
            it('rshift0', () => run([RS]));
            it('rshift1', () => run([1,RS]));
            it('rshift2', () => run([2,RS], 1));
            it('rshift3', () => run([8,RS], 4));
            it('rshift4', () => run([8,RS,RS], 2));
            it('rshift5', () => run([3,RS], 1));
            it('rshift6', () => run([DE,DE,DE,RS], -2));
            it('rshift7', () => run([4,RS], 2));
        });

        describe('lshift tests', () => {
            it('lshift0', () => run([LS]));
            it('lshift1', () => run([1,LS], 2));
            it('lshift2', () => run([2,LS], 4));
            it('lshift3', () => run([8,LS], 16));
            it('lshift4', () => run([8,LS,LS], 32));
            it('lshift5', () => run([3,LS], 6));
            it('lshift6', () => run([DE,DE,DE,LS], -6));
            it('lshift7', () => run([DE,DE,DE,DE,LS], -8));
        });

        describe('rand tests', () => {
            it('rand0', () => {
                const code = [RA];
                Config.codeLinesPerIteration = code.length;
                const org  = vm.orgs.get(0);
                org.code   = code;

                expect(org.ax).toBe(0);
                expect(org.bx).toBe(0);
                expect(org.line).toBe(0);
                vm.run();

                expect(org.ax).toBeLessThan(256);
                expect(org.bx).toBe(0);
                expect(org.code).toEqual(code);
                expect(org.line).toEqual(code.length);
            })
            it('rand1', () => {
                const code = [1,RA];
                Config.codeLinesPerIteration = code.length;
                const org  = vm.orgs.get(0);
                org.code   = code;

                expect(org.ax).toBe(0);
                expect(org.bx).toBe(0);
                expect(org.line).toBe(0);
                vm.run();

                expect(org.ax).toBe(0);
                expect(org.bx).toBe(0);
                expect(org.code).toEqual(code);
                expect(org.line).toEqual(code.length);
            })
        });

        describe('ifp tests (ax > 0)', () => {
            it('ifp0',   () => run([1,FP,2,EN], 2, 0, false));
            it('ifp1',   () => run([FP,2,EN], 0, 0, false));
            it('ifp2',   () => run([FP,2,3,EN], 0, 0, false));
            it('ifp3',   () => run([FP,1,FP,2,EN,3,EN], 0, 0, false, 2));
            it('ifp4',   () => run([1,FP,2,FP,4,EN,EN], 4, 0, false, 5));
            it('ifp5',   () => run([1,FP,0,FP,4,EN,EN], 0, 0, false, 4));
            it('ifp6',   () => run([FP,1,FP,2,EN,3], 3, 0, false, 6));
            it('ifp7',   () => run([FP,2,EN,3,EN], 3, 0, false, 2));
            it('ifp8',   () => run([FP,1,EN,3,EN], 3, 0, false, 3));
            it('ifp9',   () => run([FP,1,FP,2,EN], 2, 0, false, 4));
            it('ifp10',  () => run([FP,FP,2,EN], 0, 0, false, 3));
            it('ifp11',  () => run([FP,FP,2], 2, 0, false, 3));
            it('ifp12',  () => run([FP,2], 2, 0, false, 2));
        });

        describe('ifn tests (ax < 0)', () => {
            it('ifn0',   () => run([1,FN,2,EN], 1, 0, false, 2));
            it('ifn1',   () => run([FN,2,EN], 0, 0, false, 2));
            it('ifn2',   () => run([FN,2,3,EN], 0, 0, false, 2));
            it('ifn3',   () => run([FN,1,FN,2,EN,3,EN], 0, 0, false, 2));
            it('ifn4',   () => run([DE,FN,1,DE,DE,FN,4,EN,EN], 4, 0, false, 9));
            it('ifn5',   () => run([DE,FN,0,FN,4,EN,EN], 0, 0, false, 4));
            it('ifn6',   () => run([FN,1,FN,2,EN,3], 3, 0, false, 4));
            it('ifn7',   () => run([FN,2,EN,3,EN], 3, 0, false, 3));
            it('ifn8',   () => run([DE,FN,1,EN,3,EN], 3, 0, false, 6));
            it('ifn9',   () => run([FN,1,FN,2,EN], 1, 0, false, 4));
            it('ifn10',  () => run([FN,FN,2,EN], 0, 0, false, 3));
            it('ifn11',  () => run([FN,FN,2], 2, 0, false, 3));
            it('ifn12',  () => run([FN,2], 2, 0, false, 2));
        });

        describe('ifz tests (ax === 0)', () => {
            it('ifz0',   () => run([1,FZ,2,EN], 1, 0, false, 3));
            it('ifz1',   () => run([FZ,2,EN], 2, 0, false, 2));
            it('ifz2',   () => run([FZ,2,3,EN], 3, 0, false, 3));
            it('ifz3',   () => run([FZ,1,FZ,2,EN,3,EN], 3, 0, false, 4));
            it('ifz4',   () => run([DE,FZ,1,DE,DE,FZ,4,EN,EN], -1, 0, false, 3));
            it('ifz5',   () => run([FZ,0,FZ,4,EN,EN], 4, 0, false, 5));
            it('ifz6',   () => run([FZ,1,FZ,2,EN,3], 3, 0, false, 4));
            it('ifz7',   () => run([FZ,2,EN,3,EN], 3, 0, false, 4));
            it('ifz8',   () => run([FZ,1,EN,3,EN], 3, 0, false, 4));
            it('ifz9',   () => run([FZ,DE,FZ,2,EN], -1, 0, false, 4));
            it('ifz10',  () => run([FZ,FZ,2,EN], 2, 0, false, 3));
            it('ifz11',  () => run([FZ,FZ,2], 2, 0, false, 3));
            it('ifz12',  () => run([FZ,2], 2, 0, false, 2));
        });

        describe('ifg tests (ax > bx)', () => {
            it('ifg0',   () => run([FG,2,EN], 0, 0, false, 2));
            it('ifg1',   () => run([1,FG,2,EN], 2, 0, false, 3));
            it('ifg2',   () => run([FG,2,3,EN], 0, 0, false, 2));
            it('ifg3',   () => run([1,FG,2,FG,3,EN,4,EN], 4, 0, false, 8));
            it('ifg4',   () => run([DE,FG,1,DE,DE,FG,4,EN,EN], -1, 0, false, 3));
            it('ifg5',   () => run([1,FG,0,FG,4,EN,EN], 0, 0, false, 6));
            it('ifg6',   () => run([FG,1,FG,2,EN,3], 3, 0, false, 6));
            it('ifg7',   () => run([FG,2,EN,3,EN], 3, 0, false, 4));
            it('ifg8',   () => run([FG,1,EN,3,EN], 3, 0, false, 4));
            it('ifg9',   () => run([FG,DE,FG,2,EN], -1, 0, false, 4));
            it('ifg10',  () => run([FG,FG,2,EN], 0, 0, false, 3));
            it('ifg11',  () => run([FG,FG,2], 2, 0, false, 3));
            it('ifg12',  () => run([FG,2], 2, 0, false, 2));
        });

        describe('ifl tests (ax < bx)', () => {
            it('ifl0',   () => run([FL,2,EN], 0, 0, false, 2));
            it('ifl1',   () => run([1,FL,2,EN], 1, 0, false, 3));
            it('ifl2',   () => run([FL,2,3,EN], 0, 0, false, 2));
            it('ifl3',   () => run([DE,FL,2,FL,3,EN,4,EN], 4, 0, false, 7));
            it('ifl4',   () => run([DE,FL,1,DE,DE,FL,4,EN,EN], 4, 0, false, 8));
            it('ifl5',   () => run([1,FL,0,FL,4,EN,EN], 1, 0, false, 3));
            it('ifl6',   () => run([FL,1,FL,2,EN,3], 3, 0, false, 5));
            it('ifl7',   () => run([FL,2,EN,3,EN], 3, 0, false, 4));
            it('ifl8',   () => run([FL,1,EN,3,EN], 3, 0, false, 4));
            it('ifl9',   () => run([FL,DE,FL,2,EN], 2, 0, false, 4));
            it('ifl10',  () => run([FL,FL,2,EN], 0, 0, false, 3));
            it('ifl11',  () => run([FL,FL,2], 2, 0, false, 3));
            it('ifl12',  () => run([FL,2], 2, 0, false, 2));
        });

        describe('ife tests (ax === bx)', () => {
            it('ife0',   () => run([FE,2,EN], 2, 0, false, 2));
            it('ife1',   () => run([1,FE,2,EN], 1, 0, false, 4));
            it('ife2',   () => run([FE,2,3,EN], 3, 0, false, 4));
            it('ife3',   () => run([DE,FE,2,FE,3,EN,4,EN], -1, 0, false, 3));
            it('ife4',   () => run([DE,FE,1,DE,DE,FE,4,EN,EN], -1, 0, false, 3));
            it('ife5',   () => run([FE,0,FE,4,EN,EN], 4, 0, false, 6));
            it('ife6',   () => run([FE,1,FE,2,EN,3], 3, 0, false, 5));
            it('ife7',   () => run([FE,2,EN,3,EN], 3, 0, false, 5));
            it('ife8',   () => run([1,FE,1,EN,3,EN], 3, 0, false, 4));
            it('ife9',   () => run([FE,DE,FE,2,EN], -1, 0, false, 4));
            it('ife10',  () => run([FE,FE,2,EN], 2, 0, false, 4));
            it('ife11',  () => run([FE,FE,2], 2, 0, false, 3));
            it('ife12',  () => run([FE,2], 2, 0, false, 2));
        });

        describe('ifne tests (ax !== bx)', () => {
            it('ifne0',  () => run([FNE,2,EN], 0, 0, false, 2));
            it('ifne1',  () => run([1,FNE,2,EN], 2, 0, false, 4));
            it('ifne2',  () => run([FNE,2,3,EN], 0, 0, false, 4));
            it('ifne3',  () => run([DE,FNE,2,FNE,3,EN,4,EN], 4, 0, false, 8));
            it('ifne4',  () => run([DE,FNE,1,DE,DE,FNE,4,EN,EN], 4, 0, false, 9));
            it('ifne5',  () => run([FNE,0,FNE,4,EN,EN], 0, 0, false, 2));
            it('ifne6',  () => run([FNE,1,FNE,2,EN,3], 3, 0, false, 6));
            it('ifne7',  () => run([FNE,2,EN,3,EN], 3, 0, false, 4));
            it('ifne8',  () => run([1,FNE,1,EN,3,EN], 3, 0, false, 5));
            it('ifne9',  () => run([FNE,DE,FNE,2,EN], 2, 0, false, 5));
            it('ifne10', () => run([FNE,FNE,2,EN], 0, 0, false, 4));
            it('ifne11', () => run([FNE,FNE,2], 2, 0, false, 3));
            it('ifne12', () => run([FNE,2], 2, 0, false, 2));
        });

        describe('loop tests', () => {
            it('loop0',  () => run([LP], 0, 0, false, 1));
            it('loop1',  () => run([LP,EN], 0, 0, false, 2));
            it('loop2',  () => run([LP,1,EN], 0, 0, false, 2));
            it('loop3',  () => run([1,LP,2,EN], 2, 0, false, 4));
            it('loop4',  () => run([1,LP,2,EN,3], 3, 0, false, 6));
            it('loop5',  () => run([1,LP,IN,EN], 2, 0, false, 4));
            it('loop6',  () => run([2,LP,IN,EN], 4, 0, false, 7));
            it('loop7',  () => run([2,LP,IN,EN], 4, 0, false, 7));
            it('loop8',  () => run([1,LP,IN,EN], 2, 0, false, 5));
            it('loop9',  () => run([1,LP,IN,LP,IN,EN,EN], 4, 0, false, 10));
            it('loop10', () => run([2,LP,LP,IN,EN,EN], 8, 0, false, 24));
        });

        describe('call/func/end tests', () => {
            it('call0',  () => run([CA], 0, 0, false, 1));
            it('call1',  () => run([CA,IN,FU,IN,EN], 1, 0, false, 3));
            it('call2',  () => run([1,CA,IN,FU,IN,FU,EN,EN], 2, 0, false, 6));
            it('call3',  () => run([FU,IN,EN,CA], 1, 0, false, 4));
            it('call4',  () => run([FU,IN,EN,CA,CA], 2, 0, false, 7));
            it('call5',  () => run([FU,IN,CA], 1, 0, false, 4));
            it('call6',  () => run([FU,FU,IN,EN,CA,0], 0, 0, false, 5));
            it('call7',  () => run([FU,IN,EN,2,CA], 3, 0, false, 5));
            it('call8',  () => run([FU,IN,EN,1,DE,DE,CA], 0, 0, false, 6));
            it('call9',  () => run([FU,IN,CA,EN,CA], 2, 0, false, 5));
            it('call10', () => run([CA,CA,FU,IN,EN], 2, 0, false, 7));
            it('call11', () => run([CA,CA,FU,IN,EN], 2, 0, false, 5));
            it('call12', () => run([CA,IN,IN,EN], 2, 0, false, 4));
            it('call13', () => run([CA,IN,FU,IN,FU], 2, 0, false, 5));
        });

        describe('ret tests', () => {
            it('ret0',   () => run([RE], 0, 0, false, 1));
            it('ret1',   () => run([FU,RE,EN,CA,IN], 1, 0, false, 5));
            it('ret2',   () => run([FU,RE,RE,EN,CA,IN], 1, 0, false, 5));
            it('ret3',   () => run([FU,IN,RE,EN,CA,IN], 2, 0, false, 5));
            it('ret4',   () => run([FU,IN,TG,IN,RE,EN,CA,IN], 2, 1, false, 7));
            it('ret5',   () => run([FU,IN,TG,IN,RE,EN,CA,IN], 1, 1, false, 5));
            it('ret6',   () => run([FU,FG,RE,EN,EN,CA,IN], 1, 0, false, 5));
            it('ret7',   () => run([FU,FG,FL,RE,EN,EN,EN,CA,IN], 1, 0, false, 6));
            it('ret8',   () => run([FU,FG,FL,IN,RE,EN,EN,EN,CA], 0, 0, false, 6));
            it('ret9',   () => run([NO,NO,RE,IN,IN], 0, 0, false, 5));
            it('ret10',  () => run([IN,LP,RE,EN,IN,IN], 2, 0, false, 5));
            it('ret11',  () => run([RE], 0, 0, false, 10));
        });

        describe('nand tests', () => {
            it('nand0', () => run([NA], -1));
            it('nand1', () => run([1,NA], -1));
            it('nand2', () => run([1,TG,2,NA], -1, 1));
            it('nand3', () => run([1,TG,3,NA], -2, 1));
            it('nand4', () => run([1,TG,EQ,NA], -2, 1));
            it('nand5', () => run([DE,TG,EQ,NA], 0, -1));
            it('nand6', () => run([10,TG,EQ,NA], -11, 10));
        });

        describe('age tests', () => {
            it('age0',   () => {
                const org = vm.orgs.get(0);
                run([AG], 1);

                expect(org.age).toBe(2);
            });
            it('age1',   () => {
                const org = vm.orgs.get(0);
                run([AG,AG], 1);

                expect(org.age).toBe(2);
            });
            it('age2',   () => {
                const code = [1,AG,AG];
                Config.codeLinesPerIteration = 1;
                Config.codeRepeatsPerRun = 3;
                const org = vm.orgs.get(0);
                org.code  = code;

                expect(org.ax).toBe(0);
                expect(org.bx).toBe(0);
                expect(org.line).toBe(0);
                vm.run();

                expect(org.age).toBe(4);
                expect(org.ax).toBe(3);
                expect(org.bx).toBe(0);
                expect(org.code).toEqual(code);
                expect(org.line).toEqual(code.length);
            });
        });

        describe('line tests', () => {
            it('line0',   () => run([LI]));
            it('line1',   () => run([LI,LI], 1));
            it('line2',   () => run([1,LI,LI,2], 2));
            it('line3',   () => run([2,2,LP,LI,EN], 3, 0, false, 9));
        });

        describe('len tests', () => {
            it('len0',    () => run([LE], 1));
            it('len1',    () => run([1,LE], 2));
            it('len2',    () => run([LE,1,LE], 3));
        });

        describe('left and right tests', () => {
            it('left0',    () => run([LF]));
            it('left1',    () => run([1,SA,LF,LO]));
            it('left2',    () => run([1,SA,LF,2,SA,RI,LO], 1));
            it('left3',    () => run([RI,1,SA,LF,2,SA,RI], 2));
            it('left4',    () => run([RI,1,SA,LF,2,SA,RI,LO], 1));
            it('left5',    () => run([LF,RI,1,SA,LF,2,SA,RI,LO], 1));
            it('left loop test', () => {
                const code = [1,SA,RI,RI];
                Config.ORG_MAX_MEM_SIZE = 2;
                Config.codeLinesPerIteration = code.length;
                const vm1 = new VM(1);
                const org = vm1.addOrg(0, code);

                expect(org.ax).toBe(0);
                expect(org.bx).toBe(0);
                expect(org.line).toBe(0);
                vm1.run();

                expect(org.ax).toBe(1);
                expect(org.bx).toBe(0);
                expect(org.code).toEqual(code);
                expect(org.line).toEqual(code.length);
                vm1.destroy();
            });
        });

        describe('save and load tests', () => {
            it('save0',    () => run([SA]));
            it('save1',    () => run([LO,SA]));
            it('save2',    () => run([1,SA,SA], 1));
            it('load0',    () => run([LO]));
            it('load1',    () => run([1,LO]));
            it('save and load', () => {
                const code = [1,SA,LO,RI,SA,RI,2,SA];
                Config.codeLinesPerIteration = code.length;
                Config.ORG_MAX_MEM_SIZE = 16;
                const vm1 = new VM(1);
                const org = vm1.addOrg(0, code);

                expect(org.ax).toBe(0);
                expect(org.bx).toBe(0);
                expect(org.line).toBe(0);
                vm1.run();

                expect(org.ax).toBe(2);
                expect(org.bx).toBe(0);
                expect(org.code).toEqual(code);
                expect(org.line).toEqual(code.length);
                expect(org.mem).toEqual(Int32Array.from([1,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0]));
                vm1.destroy();
            });
        });

        describe('savea, loada tests', () => {
            it('savea0', () => run([SAA]));
            it('savea1', () => run([1,TG,2,SAA,RI,LO], 1, 1));
            it('savea2', () => run([1,TG,2,SAA,RI,LOA], 1, 0));
            it('savea3', () => run([1,TG,2,SAA,LO,TG,RI,LO], 1, 2));
            it('savea4', () => run([1,TG,2,SAA,0,TG,0,LOA], 2, 1));
            it('loada0', () => run([LOA]));
            it('loada1', () => run([1,SA,LOA], 1));
            it('loada2', () => run([1,SA,RI,2,SA,LOA], 2));
            it('loada3', () => run([1,SA,RI,2,SA,LF,LOA], 1, 2));
        });

        describe('read tests', () => {
            it('read0', () => run([RD], RD));
            it('read1', () => run([0,RD]));
            it('read2', () => run([1,RD], RD));
            it('read3', () => run([1,DE,DE,RD], 1));
            it('read4', () => run([10,RD], RD));
            it('read5', () => run([0,1,2,7,4,3,RD], 7));
        });

        describe('break tests', () => {
            it('break0', () => run([BR]));
            it('break1', () => run([1,LP,BR,2,EN], 1, 0, false, 4));
            it('break2', () => run([2,LP,4,LP,IN,BR,2,EN,EN], 5, 0, false, 13));
        });
    });
});