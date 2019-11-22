/* eslint-disable global-require */
describe('src/irma/Mutations', () => {
    const Mutations = require('./Mutations');
    const Config    = require('./../Config');
    const Organism  = require('./Organism');

    const CMD_OFFS  = Config.CODE_CMD_OFFS;
    let   org;
    let   trunc;
    let   getRand;
    let   randVal;
    let   randI;
    let   randCmd;

    beforeEach(() => {
        randVal     = [0,1,2,3,4,5];
        randI       = 0;
        randCmd     = CMD_OFFS + 3;
        trunc       = Math.trunc;
        getRand     = Mutations.randCmd;

        org         = new Organism(1, 2, 3, 0, 1000);
        org.code    = [CMD_OFFS, CMD_OFFS + 1];
        org.probArr = [0,1,2,3,4,5,6,7];
        org.percent = .5;

        Math.trunc        = () => randVal[randI++];
        Mutations.randCmd = () => randCmd;
    });
    afterEach (() => {
        Math.trunc           = trunc;
        Mutations.randCmd = getRand;
        org                  = null;
    });

    describe('Checks amount of mutations depending on mutation percent', () => {
        it('Checks mutate() method with one mutation', () => {
            let i = 0;
            org.probArr = [0,0,0,0,0,0,0,0];
            randVal     = [0,0,0,0,0,0,0,0];
            org.code    = [CMD_OFFS];
            org.percent = 1;
            Mutations.randCmd = () => i++;
            Mutations.mutate(org);
            expect(i).toBe(1);
        });
        it('Checks mutate() method with two mutations', () => {
            let i = 0;
            org.probArr = [0,0,0,0,0,0,0,0];
            randVal     = [0,0,0,0,0,0,0,0];
            org.code    = [CMD_OFFS, CMD_OFFS];
            org.percent = 1;
            Mutations.randCmd = () => i++;
            Mutations.mutate(org);
            expect(i).toBe(2);
        });
        it('Checks mutate() method with one mutation', () => {
            let i = 0;
            org.probArr = [0,0,0,0,0,0,0,0];
            randVal     = [0,0,0,0,0,0,0,0];
            org.code    = [CMD_OFFS, CMD_OFFS];
            org.percent = .5;
            Mutations.randCmd = () => i++;
            Mutations.mutate(org);
            expect(i).toBe(1);
        });
        it('Checks mutate() method with one mutation', () => {
            let i = 0;
            org.probArr = [0,0,0,0,0,0,0,0];
            randVal     = [0,0,0,0,0,0,0,0];
            org.code    = [CMD_OFFS, CMD_OFFS];
            org.percent = .1;
            Mutations.randCmd = () => i++;
            Mutations.mutate(org);
            expect(i).toBe(1);
        });
        it('Checks mutate() method with two mutations', () => {
            let i = 0;
            org.probArr = [0,0,0,0,0,0,0,0];
            randVal     = [0,0,0,0,0,0,0,0];
            org.code    = [CMD_OFFS, CMD_OFFS];
            org.percent = 0;
            Mutations.randCmd = () => i++;
            Mutations.mutate(org);
            expect(i).toBe(1);
        });
        it('Checks mutate() method with one mutation', () => {
            let i = 0;
            org.probArr = [0,0,0,0,0,0,0,0];
            randVal     = [0,0,0,0,0,0,0,0];
            org.code    = [CMD_OFFS];
            org.percent = 1;
            Mutations.randCmd = () => i++;
            Mutations.mutate(org);
            expect(i).toBe(1);
        });
    });

    describe('"change" mutation tests', () => {
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

    describe('"del" mutation tests', () => {
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

    describe('"period" mutation tests', () => {
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

    describe('"percent" mutation tests', () => {
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

    describe('"probs" mutation tests', () => {
        it('Checks mutate() method with "probs" mutation 1', () => {
            org.probArr = [4,1,2,3,4,5,6,7];
            randVal     = [0,0,0,3,4,5];
            const probs = org.probs.slice();
            probs[0]    = 1;
            Mutations.mutate(org);
            expect(org.probs).toEqual(probs);
        });
    });

    describe('"insert" mutation tests', () => {
        it('Checks mutate() method with "insert" mutation 1', () => {
            org.probArr = [5,1,2,3,4,5,6,7];
            randVal     = [0,0,0,1,4,5];
            Mutations.mutate(org);
            expect(org.code).toEqual([CMD_OFFS + 3, CMD_OFFS, CMD_OFFS + 1]);
        });
        it('Checks mutate() method with "insert" mutation 2', () => {
            org.probArr = [5,1,2,3,4,5,6,7];
            randVal     = [0,1,1,0,4,5];
            Mutations.mutate(org);
            expect(org.code).toEqual([CMD_OFFS, CMD_OFFS + 3, CMD_OFFS + 1]);
        });
    });

    describe('"copy" mutation tests', () => {
        it('Checks mutate() method with "copy" mutation 1', () => {
            org.probArr = [6,1,2,3,4,5,6,7];
            randVal     = [0,0,1,0,0];
            Mutations.mutate(org);
            expect(org.code).toEqual([CMD_OFFS, CMD_OFFS, CMD_OFFS + 1]);
        });
        it('Checks mutate() method with "copy" mutation 2', () => {
            org.probArr = [6,1,2,3,4,5,6,7];
            randVal     = [0,0,1,1,1];
            Mutations.mutate(org);
            expect(org.code).toEqual([CMD_OFFS, CMD_OFFS + 1, CMD_OFFS]);
        });
        it('Checks mutate() method with "copy" mutation 3 (CODE_MAX_STACK_SIZE)', () => {
            org.probArr = [6,1,2,3,4,5,6,7];
            randVal     = [0,0,30001,1,1];
            Mutations.mutate(org);
            expect(org.code).toEqual([CMD_OFFS, CMD_OFFS + 1]);
        });
        it('Checks mutate() method with "copy" mutation 4 (orgMaxCodeSize)', () => {
            const size  = Config.orgMaxCodeSize;
            Config.orgMaxCodeSize = 64;
            org.probArr = [6,1,2,3,4,5,6,7];
            randVal     = [0,0,65,1,1];
            Mutations.mutate(org);
            expect(org.code).toEqual([CMD_OFFS, CMD_OFFS + 1]);
            Config.orgMaxCodeSize = size;
        });
    });

    describe('"cut" mutation tests', () => {
        it('Checks mutate() method with "cut" mutation 1', () => {
            org.probArr = [7, 1, 2, 3, 4, 5, 6, 7];
            randVal     = [0, 0, 1];
            Mutations.mutate(org);
            expect(org.code).toEqual([CMD_OFFS + 1]);
        });
        it('Checks mutate() method with "cut" mutation 2', () => {
            org.probArr = [7, 1, 2, 3, 4, 5, 6, 7];
            randVal     = [0, 1, 1];
            Mutations.mutate(org);
            expect(org.code).toEqual([CMD_OFFS]);
        });
        it('Checks mutate() method with "cut" mutation 3', () => {
            org.code    = [CMD_OFFS, CMD_OFFS + 1, CMD_OFFS + 2];
            org.probArr = [7, 1, 2, 3, 4, 5, 6, 7];
            randVal     = [0, 1, 2];
            Mutations.mutate(org);
            expect(org.code).toEqual([CMD_OFFS]);
        });
    });
});