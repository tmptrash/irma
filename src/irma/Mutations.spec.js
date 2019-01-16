describe('src/irma/Mutations', () => {
    const Mutations = require('./Mutations');
    const Config    = require('./../Config');
    const Organism  = require('./Organism');
    const Helper    = require('./../common/Helper');

    const CMD_OFFS  = Config.CODE_CMD_OFFS;
    let   pIndex    = 0;
    let   probIndex;
    let   trunc;
    let   getRand;
    let   randVal;
    let   randCmd;

    beforeEach(() => {
        pIndex    = 0;
        randVal   = 1;
        randCmd   = CMD_OFFS;
        probIndex = Helper.probIndex;
        trunc     = Math.trunc;
        getRand   = Mutations.getRandCmd;

        Helper.probIndex     = () => pIndex;
        Math.trunc           = () => randVal;
        Mutations.getRandCmd = () => randCmd;
    });
    afterEach (() => {
        Helper.probIndex     = probIndex;
        Math.trunc           = trunc;
        Mutations.getRandCmd = getRand;
    });

    it('Checks mutate() method with "change" mutation 1', () => {
        const org   = new Organism(1, 2, 3, 0, 1000);
        org.code    = [CMD_OFFS, CMD_OFFS];
        org.percent = .5;
        randVal     = 0;
        randCmd     = 123;

        Mutations.mutate(org);
        expect(org.code).toEqual([randCmd, CMD_OFFS]);
    });
    it('Checks mutate() method with "change" mutation 11', () => {
        const org   = new Organism(1, 2, 3, 0, 1000);
        org.code    = [CMD_OFFS, CMD_OFFS + 1];
        org.percent = .5;
        randVal     = 1;
        randCmd     = 123;

        Mutations.mutate(org);
        expect(org.code).toEqual([CMD_OFFS, randCmd]);
    });
    it('Checks mutate() method with "change" mutation 12', () => {
        const org   = new Organism(1, 2, 3, 0, 1000);
        org.code    = [CMD_OFFS, CMD_OFFS + 1];
        org.percent = 1;
        randVal     = 1;
        randCmd     = 123;

        Mutations.mutate(org);
        expect(org.code).toEqual([CMD_OFFS, randCmd]);
    });

    it('Checks mutate() method with "change" mutation 2', () => {
        const org   = new Organism(1, 2, 3, 0, 1000);
        org.code    = [CMD_OFFS];
        org.percent = .5;
        randVal     = 0;
        randCmd     = 123;

        Mutations.mutate(org);
        expect(org.code).toEqual([randCmd]);
    });
});