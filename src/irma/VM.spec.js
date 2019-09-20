describe('src/irma/VM', () => {
    const VM        = require('./VM');
    let   Config    = require('./../Config');
    //const Helper    = require('./../common/Helper');
    const TG        = Config.CODE_CMD_OFFS;
    const SH        = Config.CODE_CMD_OFFS+1;
    const EQ        = Config.CODE_CMD_OFFS+2;
    const PO        = Config.CODE_CMD_OFFS+3;
    const PU        = Config.CODE_CMD_OFFS+4;
    const NO        = Config.CODE_CMD_OFFS+5;
    const AD        = Config.CODE_CMD_OFFS+6;
    const SU        = Config.CODE_CMD_OFFS+7;
    const MU        = Config.CODE_CMD_OFFS+8;
    const DI        = Config.CODE_CMD_OFFS+9;
    const IN        = Config.CODE_CMD_OFFS+10;
    const DE        = Config.CODE_CMD_OFFS+11;
    const RS        = Config.CODE_CMD_OFFS+12;
    const LS        = Config.CODE_CMD_OFFS+13;
    const RA        = Config.CODE_CMD_OFFS+14;
    const FP        = Config.CODE_CMD_OFFS+15;
    const FN        = Config.CODE_CMD_OFFS+16;
    const FZ        = Config.CODE_CMD_OFFS+17;
    const FG        = Config.CODE_CMD_OFFS+18;
    const FL        = Config.CODE_CMD_OFFS+19;
    const FE        = Config.CODE_CMD_OFFS+20;
    const FNE       = Config.CODE_CMD_OFFS+21;
    const LP        = Config.CODE_CMD_OFFS+22;
    const CA        = Config.CODE_CMD_OFFS+23;
    const FU        = Config.CODE_CMD_OFFS+24;
    const RE        = Config.CODE_CMD_OFFS+25;
    const EN        = Config.CODE_CMD_OFFS+26;
    const RX        = Config.CODE_CMD_OFFS+27;
    const AR        = Config.CODE_CMD_OFFS+28;

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
            orgMaxCodeSize             : 5,
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
    function run(code, ax = 0, bx = 0, ret = 0, checkLen = true, lines = null) {
        Config.codeLinesPerIteration = lines === null ? code.length : lines;
        const org = vm._orgs.added();
        org.code  = code.slice(); // code copy
        org.preprocess();
        expect(org.ax).toBe(0);
        expect(org.bx).toBe(0);
        expect(org.ret).toBe(0);
        expect(org.line).toBe(0);
        vm.run();
        expect(org.ax).toBe(ax);
        expect(org.bx).toBe(bx);
        expect(org.ret).toBe(ret);
        expect(org.code).toEqual(code);
        checkLen && expect(org.line).toEqual(org.code.length);
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
            it('toggle0', () => run([TG]));
            it('toggle1', () => run([TG,TG]));
            it('toggle2', () => run([1,TG], 0, 1));
            it('toggle2', () => run([TG,1], 1));
            it('toggle3', () => run([1,TG,2,TG], 1, 2));
            it('toggle4', () => run([1,TG,2,TG,TG], 2, 1));
            it('toggle5', () => run([TG,TG,1,TG,2], 2, 1));
            it('toggle6', () => run([1,TG,TG], 1));
            it('toggle7', () => run([1,TG,TG,TG], 0, 1));
        });

        describe('shift tests', () => {
            it('shift0', () => run([SH]));
            it('shift1', () => run([SH,SH]));
            it('shift2', () => run([1,SH]));
            it('shift3', () => run([1,SH,SH,SH],1));
            it('shift4', () => run([1,SH,2,SH,3,SH],1));
            it('shift5', () => run([1,SH,2,SH,3],3));
            it('shift6', () => run([1,SH,2,SH,3,SH,SH],2));
        });

        describe('eq tests', () => {
            it('eq0', () => run([EQ]));
            it('eq1', () => run([EQ,EQ]));
            it('eq2', () => run([1,EQ]));
            it('eq3', () => run([1,TG,EQ], 1, 1));
        });

        describe('pop tests', () => {
            it('pop0', () => run([PO]));
            it('pop1', () => run([PO,PO]));
            it('pop2', () => run([1,PU,0,PO], 1));
            it('pop3', () => run([1,PU,0,PO,PO]));
            it('pop4', () => run([1,PU,PU,0,PO,PO], 1));
            it('pop4', () => run([1,PU,0,PO,PO,1,PU,0,PO], 1));
        });

        describe('push tests', () => {
            it('push0', () => run([PU]));
            it('push2', () => run([1,PU,0,PO], 1));
            it('push2', () => run([1,PU,PU,PU,PU,PU,2,PU,PO], 1));
        });

        describe('nop tests', () => {
            it('nop0', () => run([NO]));
            it('nop1', () => run([NO,NO,NO]));
            it('nop2', () => run([1,NO], 1));
            it('nop3', () => run([NO,1,NO], 1));
        });

        describe('add tests', () => {
            it('add0', () => run([AD]));
            it('add1', () => run([1,TG,2,AD], 3, 1));
            it('add2', () => run([1,TG,0,AD], 1, 1));
            it('add3', () => run([1,TG,AD,AD], 2, 1));
            it('add4', () => run([-1,TG,AD,AD], -2, -1));
            it('add5', () => run([-1,TG,2,AD], 1, -1));
        });

        describe('sub tests', () => {
            it('sub0', () => run([SU]));
            it('sub1', () => run([1,TG,2,SU], 1, 1));
            it('sub2', () => run([1,TG,SU], -1, 1));
            it('sub3', () => run([-1,TG,-2,SU], -1, -1));
            it('sub4', () => run([3,TG,-1,SU], -4, 3));
            it('sub5', () => run([3,TG,1,SU], -2, 3));
        });

        describe('mul tests', () => {
            it('mul0', () => run([MU]));
            it('mul1', () => run([2,TG,3,MU], 6, 2));
            it('mul2', () => run([1,TG,MU], 0, 1));
            it('mul3', () => run([-1,TG,MU], 0, -1));
            it('mul4', () => run([-3,TG,-2,MU], 6, -3));
            it('mul5', () => run([1,TG,2,MU], 2, 1));
        });

        describe('div tests', () => {
            it('div0', () => run([DI], -Number.MAX_VALUE));
            it('div1', () => run([3,TG,2,DI], 1, 3));
            it('div2', () => run([1,TG,DI], 0, 1));
            it('div3', () => run([-1,TG,DI], 0, -1));
            it('div4', () => run([-3,TG,-2,DI], 1, -3));
            it('div5', () => run([1,TG,2,DI], 2, 1));
            it('div6', () => run([2,TG,-1,DI], 0, 2));
            it('div7', () => run([2,DI], -Number.MAX_VALUE));
            it('div8', () => run([5,TG,10,DI], 2, 5));
        });

        describe('inc tests', () => {
            it('inc0', () => run([IN], 1));
            it('inc1', () => run([2,IN], 3));
            it('inc2', () => run([2,IN,IN,IN], 5));
            it('inc3', () => run([2,IN,IN,2,IN], 3));
            it('inc4', () => run([-2,IN], -1));
            it('inc5', () => run([-1,IN]));
        });

        describe('dec tests', () => {
            it('dec0', () => run([DE], -1));
            it('dec1', () => run([2,DE], 1));
            it('dec2', () => run([2,DE,DE,DE], -1));
            it('dec3', () => run([2,DE,DE,2,DE], 1));
            it('dec4', () => run([-2,DE], -3));
            it('dec5', () => run([1,DE]));
        });

        describe('rshift tests', () => {
            it('rshift0', () => run([RS]));
            it('rshift1', () => run([1,RS]));
            it('rshift2', () => run([2,RS], 1));
            it('rshift3', () => run([8,RS], 4));
            it('rshift4', () => run([8,RS,RS], 2));
            it('rshift5', () => run([3,RS], 1));
            it('rshift6', () => run([-3,RS], -2));
            it('rshift7', () => run([-4,RS], -2));
        });

        describe('lshift tests', () => {
            it('lshift0', () => run([LS]));
            it('lshift1', () => run([1,LS], 2));
            it('lshift2', () => run([2,LS], 4));
            it('lshift3', () => run([8,LS], 16));
            it('lshift4', () => run([8,LS,LS], 32));
            it('lshift5', () => run([3,LS], 6));
            it('lshift6', () => run([-3,LS], -6));
            it('lshift7', () => run([-4,LS], -8));
        });

        describe('rand tests', () => {
            it('rand0', () => {
                const code = [RA];
                Config.codeLinesPerIteration = code.length;
                const org  = vm._orgs.added();
                org.code  = code;
                expect(org.ax).toBe(0);
                expect(org.bx).toBe(0);
                expect(org.ret).toBe(0);
                expect(org.line).toBe(0);
                vm.run();
                expect(org.bx).toBe(0);
                expect(org.ret).toBe(0);
                expect(org.code).toEqual(code);
                expect(org.line).toEqual(code.length);
            })
        });

        describe('ifp tests (ax > 0)', () => {
            it('ifp0',  () => run([1,FP,2,EN], 2, 0, 0, false));
            it('ifp1',  () => run([FP,2,EN], 0, 0, 0, false));
            it('ifp2',  () => run([FP,2,3,EN], 0, 0, 0, false));
            it('ifp3',  () => run([FP,1,FP,2,EN,3,EN], 0, 0, 0, false, 2));
            it('ifp4',  () => run([1,FP,2,FP,4,EN,EN], 4, 0, 0, false, 5));
            it('ifp5',  () => run([1,FP,0,FP,4,EN,EN], 0, 0, 0, false, 4));
            it('ifp6',  () => run([FP,1,FP,2,EN,3], 3, 0, 0, false, 6));
            it('ifp7',  () => run([FP,2,EN,3,EN], 3, 0, 0, false, 2));
            it('ifp8',  () => run([FP,1,EN,3,EN], 3, 0, 0, false, 3));
            it('ifp9',  () => run([FP,1,FP,2,EN], 2, 0, 0, false, 4));
            it('ifp10', () => run([FP,FP,2,EN], 0, 0, 0, false, 3));
            it('ifp11', () => run([FP,FP,2], 2, 0, 0, false, 3));
            it('ifp12', () => run([FP,2], 2, 0, 0, false, 2));
        });

        describe('ifn tests (ax < 0)', () => {
            it('ifn0',  () => run([1,FN,2,EN], 1, 0, 0, false, 2));
            it('ifn1',  () => run([FN,2,EN], 0, 0, 0, false, 2));
            it('ifn2',  () => run([FN,2,3,EN], 0, 0, 0, false, 2));
            it('ifn3',  () => run([FN,1,FN,2,EN,3,EN], 0, 0, 0, false, 2));
            it('ifn4',  () => run([-1,FN,-2,FN,4,EN,EN], 4, 0, 0, false, 5));
            it('ifn5',  () => run([-1,FN,0,FN,4,EN,EN], 0, 0, 0, false, 4));
            it('ifn6',  () => run([FN,1,FN,2,EN,3], 3, 0, 0, false, 4));
            it('ifn7',  () => run([FN,2,EN,3,EN], 3, 0, 0, false, 3));
            it('ifn8',  () => run([-1,FN,1,EN,3,EN], 3, 0, 0, false, 5));
            it('ifn9',  () => run([FN,-1,FN,2,EN], 2, 0, 0, false, 4));
            it('ifn10', () => run([FN,FN,2,EN], 0, 0, 0, false, 3));
            it('ifn11', () => run([FN,FN,2], 2, 0, 0, false, 3));
            it('ifn12', () => run([FN,2], 2, 0, 0, false, 2));
        });

        describe('ifz tests (ax === 0)', () => {
            it('ifz0',  () => run([1,FZ,2,EN], 1, 0, 0, false, 3));
            it('ifz1',  () => run([FZ,2,EN], 2, 0, 0, false, 2));
            it('ifz2',  () => run([FZ,2,3,EN], 3, 0, 0, false, 3));
            it('ifz3',  () => run([FZ,1,FZ,2,EN,3,EN], 3, 0, 0, false, 4));
            it('ifz4',  () => run([-1,FZ,-2,FZ,4,EN,EN], -1, 0, 0, false, 3));
            it('ifz5',  () => run([FZ,0,FZ,4,EN,EN], 4, 0, 0, false, 5));
            it('ifz6',  () => run([FZ,1,FZ,2,EN,3], 3, 0, 0, false, 4));
            it('ifz7',  () => run([FZ,2,EN,3,EN], 3, 0, 0, false, 4));
            it('ifz8',  () => run([FZ,1,EN,3,EN], 3, 0, 0, false, 4));
            it('ifz9',  () => run([FZ,-1,FZ,2,EN], -1, 0, 0, false, 4));
            it('ifz10', () => run([FZ,FZ,2,EN], 2, 0, 0, false, 3));
            it('ifz11', () => run([FZ,FZ,2], 2, 0, 0, false, 3));
            it('ifz12', () => run([FZ,2], 2, 0, 0, false, 2));
        });

        describe('ifg tests (ax > bx)', () => {
            it('ifg0',  () => run([FG,2,EN], 0, 0, 0, false, 2));
            it('ifg1',  () => run([1,FG,2,EN], 2, 0, 0, false, 3));
            it('ifg2',  () => run([FG,2,3,EN], 0, 0, 0, false, 2));
            it('ifg3',  () => run([1,FG,2,FG,3,EN,4,EN], 4, 0, 0, false, 8));
            it('ifg4',  () => run([-1,FG,-2,FG,4,EN,EN], -1, 0, 0, false, 3));
            it('ifg5',  () => run([1,FG,0,FG,4,EN,EN], 0, 0, 0, false, 5));
            it('ifg6',  () => run([FG,1,FG,2,EN,3], 3, 0, 0, false, 6));
            it('ifg7',  () => run([FG,2,EN,3,EN], 3, 0, 0, false, 4));
            it('ifg8',  () => run([FG,1,EN,3,EN], 3, 0, 0, false, 4));
            it('ifg9',  () => run([FG,-1,FG,2,EN], -1, 0, 0, false, 4));
            it('ifg10', () => run([FG,FG,2,EN], 0, 0, 0, false, 3));
            it('ifg11', () => run([FG,FG,2], 2, 0, 0, false, 3));
            it('ifg12', () => run([FG,2], 2, 0, 0, false, 2));
        });

        describe('ifl tests (ax < bx)', () => {
            it('ifl0',  () => run([FL,2,EN], 0, 0, 0, false, 2));
            it('ifl1',  () => run([1,FL,2,EN], 1, 0, 0, false, 3));
            it('ifl2',  () => run([FL,2,3,EN], 0, 0, 0, false, 2));
            it('ifl3',  () => run([-1,FL,2,FL,3,EN,4,EN], 4, 0, 0, false, 7));
            it('ifl4',  () => run([-1,FL,-2,FL,4,EN,EN], 4, 0, 0, false, 7));
            it('ifl5',  () => run([1,FL,0,FL,4,EN,EN], 1, 0, 0, false, 3));
            it('ifl6',  () => run([FL,1,FL,2,EN,3], 3, 0, 0, false, 5));
            it('ifl7',  () => run([FL,2,EN,3,EN], 3, 0, 0, false, 4));
            it('ifl8',  () => run([FL,1,EN,3,EN], 3, 0, 0, false, 4));
            it('ifl9',  () => run([FL,-1,FL,2,EN], 2, 0, 0, false, 4));
            it('ifl10', () => run([FL,FL,2,EN], 0, 0, 0, false, 3));
            it('ifl11', () => run([FL,FL,2], 2, 0, 0, false, 3));
            it('ifl12', () => run([FL,2], 2, 0, 0, false, 2));
        });

        describe('ife tests (ax === bx)', () => {
            it('ife0',  () => run([FE,2,EN], 2, 0, 0, false, 2));
            it('ife1',  () => run([1,FE,2,EN], 1, 0, 0, false, 4));
            it('ife2',  () => run([FE,2,3,EN], 3, 0, 0, false, 4));
            it('ife3',  () => run([-1,FE,2,FE,3,EN,4,EN], -1, 0, 0, false, 3));
            it('ife4',  () => run([-1,FE,-2,FE,4,EN,EN], -1, 0, 0, false, 7));
            it('ife5',  () => run([FE,0,FE,4,EN,EN], 4, 0, 0, false, 6));
            it('ife6',  () => run([FE,1,FE,2,EN,3], 3, 0, 0, false, 5));
            it('ife7',  () => run([FE,2,EN,3,EN], 3, 0, 0, false, 5));
            it('ife8',  () => run([1,FE,1,EN,3,EN], 3, 0, 0, false, 4));
            it('ife9',  () => run([FE,-1,FE,2,EN], -1, 0, 0, false, 4));
            it('ife10', () => run([FE,FE,2,EN], 2, 0, 0, false, 4));
            it('ife11', () => run([FE,FE,2], 2, 0, 0, false, 3));
            it('ife12', () => run([FE,2], 2, 0, 0, false, 2));
        });

        describe('ifne tests (ax !== bx)', () => {
            it('ifne0',  () => run([FNE,2,EN], 0, 0, 0, false, 2));
            it('ifne1',  () => run([1,FNE,2,EN], 2, 0, 0, false, 4));
            it('ifne2',  () => run([FNE,2,3,EN], 0, 0, 0, false, 4));
            it('ifne3',  () => run([-1,FNE,2,FNE,3,EN,4,EN], 4, 0, 0, false, 8));
            it('ifne4',  () => run([-1,FNE,-2,FNE,4,EN,EN], 4, 0, 0, false, 5));
            it('ifne5',  () => run([FNE,0,FNE,4,EN,EN], 0, 0, 0, false, 2));
            it('ifne6',  () => run([FNE,1,FNE,2,EN,3], 3, 0, 0, false, 6));
            it('ifne7',  () => run([FNE,2,EN,3,EN], 3, 0, 0, false, 4));
            it('ifne8',  () => run([1,FNE,1,EN,3,EN], 3, 0, 0, false, 5));
            it('ifne9',  () => run([FNE,-1,FNE,2,EN], 2, 0, 0, false, 5));
            it('ifne10', () => run([FNE,FNE,2,EN], 0, 0, 0, false, 4));
            it('ifne11', () => run([FNE,FNE,2], 2, 0, 0, false, 3));
            it('ifne12', () => run([FNE,2], 2, 0, 0, false, 2));
        });

        describe('loop tests', () => {
            it('loop0',  () => run([LP], 0, 0, 0, false, 1));
            it('loop1',  () => run([LP,EN], 0, 0, 0, false, 2));
            it('loop2',  () => run([LP,1,EN], 0, 0, 0, false, 2));
            it('loop3',  () => run([1,LP,2,EN], 2, 0, 0, false, 4));
            it('loop4',  () => run([1,LP,2,EN,3], 3, 0, 0, false, 6));
            it('loop5',  () => run([1,LP,IN,EN], 2, 0, 0, false, 4));
            it('loop6',  () => run([2,LP,IN,EN], 4, 0, 0, false, 7));
            it('loop7',  () => run([2,LP,IN,EN], 4, 0, 0, false, 7));
            it('loop8',  () => run([-1,LP,IN,EN], -1, 0, 0, false, 3));
            it('loop9',  () => run([1,LP,IN,LP,IN,EN,EN], 4, 0, 0, false, 10));
            it('loop10', () => run([2,LP,LP,IN,EN,EN], 8, 0, 0, false, 24));
        });

        describe('call/func tests', () => {
            it('call0',  () => run([CA], 0, 0, 0, false, 1));
            it('call1',  () => run([CA,IN,FU,IN,EN], 1, 0, 0, false, 4));
            it('call2',  () => run([1,CA,IN,FU,IN,FU,EN,EN], 2, 0, 0, false, 6));
            it('call3',  () => run([FU,IN,EN,CA], 0, 0, 0, false, 4));
            it('call4',  () => run([FU,IN,EN,CA,CA], 0, 0, 0, false, 8));
            it('call5',  () => run([FU,IN,CA], 1, 0, 0, false, 4));
            it('call6',  () => run([FU,FU,IN,EN,CA], 0, 0, 0, false, 5));
            it('call7',  () => run([FU,IN,EN,2,CA], 3, 0, 0, false, 4));
            it('call8',  () => run([FU,IN,EN,-2,CA], -1, 0, 0, false, 4));
            it('call9',  () => run([FU,IN,CA,EN,CA], 2, 0, 0, false, 5));
            it('call10', () => run([CA,CA,FU,IN,EN], 0, 0, 0, false, 7));
            it('call11', () => run([CA,CA,FU,IN,EN], 1, 0, 0, false, 5));
            it('call11', () => run([CA,IN,IN,EN], 2, 0, 0, false, 4));
            it('call12', () => run([CA,IN,FU,IN,FU], 2, 0, 0, false, 5));
        });

        describe('ret tests', () => {
            it('ret0',   () => run([RE], 0, 0, 0, false, 1));
            it('ret1',   () => run([FU,RE,EN,CA,IN], 1, 0, 0, false, 5));
            it('ret2',   () => run([FU,RE,RE,EN,CA,IN], 1, 0, 0, false, 5));
            it('ret3',   () => run([FU,IN,RE,EN,CA,IN], 1, 0, 0, false, 5));
            it('ret4',   () => run([FU,IN,TG,IN,RE,EN,CA,IN], 1, 0, 0, false, 7));
            it('ret5',   () => run([FU,IN,TG,IN,RE,EN,CA,IN], 1, 1, 0, false, 5));
            it('ret6',   () => run([FU,FG,RE,EN,EN,CA,IN], 1, 0, 0, false, 5));
            it('ret7',   () => run([FU,FG,FL,RE,EN,EN,EN,CA,IN], 1, 0, 0, false, 6));
            it('ret8',   () => run([FU,FG,FL,IN,RE,EN,EN,EN,CA], 0, 0, 0, false, 6));
            it('ret9',   () => run([NO,NO,RE,IN,IN], 0, 0, 0, false, 5));
            it('ret10',  () => run([IN,LP,RE,EN,IN,IN], 2, 0, 0, false, 5));
            it('ret11',  () => run([RE], 0, 0, 0, false, 10));
        });

        describe('numeric constant tests', () => {
            it('const0', () => run([0]));
            it('const1', () => run([1], 1));
            it('const2', () => run([-1], -1));
            it('const3', () => run([-3], -3));
            it('const4', () => run([-3,1], 1));
            it('const5', () => run([-3,-1], -1));
            it('const6', () => run([IN,10], 10));
            it('const7', () => run([IN,10,IN], 11));
            it('const8', () => run([1,TG,2,Config.CODE_CMD_OFFS], 1, 2));
            it('const9', () => run([1,TG,2], 2, 1));
        });

        describe('retax tests', () => {
            it('retax0', () => run([RX]));
            it('retax1', () => run([2,AR,1,RX], 2, 0, 2));
        });

        describe('axret tests', () => {
            it('axret0', () => run([AR]));
            it('axret1', () => run([1,AR], 1, 0, 1));
        });
    });
});


































