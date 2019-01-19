describe('src/irma/Mutations', () => {
    const Mutations = require('./Mutations');
    const Config    = require('./../Config');
    const Organism  = require('./Organism');
    const Helper    = require('./../common/Helper');

    const CMD_OFFS  = Config.CODE_CMD_OFFS;
    let   probIndex;
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
        probIndex   = Helper.probIndex;
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
        Helper.probIndex     = probIndex;
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

    describe('"amount" mutation tests', () => {
        it('Checks mutate() method with "amount" mutation 1', () => {
            const random = Math.random;
            Math.random = () => .1;
            org.probArr = [3,1,2,3,4,5,6,7];
            Mutations.mutate(org);
            expect(org.percent).toEqual(.1);
            Math.random = random;
        });
        it('Checks mutate() method with "amount" mutation 2', () => {
            const random = Math.random;
            Math.random = () => 0;
            org.probArr = [3,1,2,3,4,5,6,7];
            Mutations.mutate(org);
            expect(org.percent).toEqual(.02);
            Math.random = random;
        });
    });
});