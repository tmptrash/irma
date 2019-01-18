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
        xit('Checks mutate() method with "change" mutation 1', () => {
            Mutations.mutate(org);
            expect(org.code).toEqual([CMD_OFFS, randCmd]);
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
            randCmd     = CMD_OFFS + 3;
            org.probArr = [0,0,2,3,4,5,6,7];

            Mutations.mutate(org);
            expect(org.code).toEqual([randCmd, randCmd]);
        });
        it('Checks mutate() method with "change" mutation 4', () => {
            org.percent = .1;
            randVal     = [0,0];
            randCmd     = CMD_OFFS + 3;

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
        it('Checks mutate() method with "del" mutation 11', () => {
            org.probArr = [1,1,2,3,4,5,6,7];
            randVal     = [0,0,2,3,4,5];
            Mutations.mutate(org);
            expect(org.code).toEqual([CMD_OFFS + 1]);
        });
    });
});