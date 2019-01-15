describe('src/irma/Mutations', () => {
    const Mutations = require('./Mutations');
    const Config    = require('./../Config');
    const Organism  = require('./Organism');
    const Helper    = require('./../common/Helper');

    let   pIndex    = 0;
    let   probIndex;
    let   random;
    let   getRand;
    let   randVal;
    let   randCmd;

    beforeEach(() => {
        pIndex    = 0;
        randVal   = 1;
        randCmd   = Config.CODE_CMD_OFFS;
        probIndex = Helper.probIndex;
        random    = Math.random;
        getRand   = Mutations.getRandCmd;

        Helper.probIndex     = () => pIndex;
        Math.random          = () => randVal;
        Mutations.getRandCmd = () => randCmd;
    });
    afterEach(() => {
        Helper.probIndex     = probIndex;
        Math.random          = random;
        Mutations.getRandCmd = getRand;
    });

    it('Checks mutate() method with "change" mutation 1', () => {
        const org   = new Organism(1, 2, 3, 0, 1000);
        org.code    = [Config.CODE_CMD_OFFS, Config.CODE_CMD_OFFS + 1];
        org.percent = .5;
        randVal     = 0;
        randCmd     = 123;

        Mutations.mutate(org);
        expect(org.code[0]).toBe(randCmd);
    });

    it('Checks mutate() method with "change" mutation 2', () => {
        const org   = new Organism(1, 2, 3, 0, 1000);
        org.code    = [Config.CODE_CMD_OFFS];
        org.percent = .5;
        randVal     = 0;
        randCmd     = 123;

        Mutations.mutate(org);
        expect(org.code[0]).toBe(randCmd);
    });
});