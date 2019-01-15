describe('src/irma/Mutations', () => {
    const Mutations = require('./Mutations');
    const Config    = require('./../Config');
    const Organism  = require('./Organism');
    const Helper    = require('./../common/Helper');

    let   index     = 0;
    let   probIndex;
    let   random;
    let   getRand;
    let   randVal;
    let   randCmd;

    beforeEach(() => {
        index     = 0;
        randVal   = 1;
        randCmd   = Config.CODE_CMD_OFFS;
        probIndex = Helper.probIndex;
        random    = Math.random;
        getRand   = Mutations.getRandCmd;

        Helper.probIndex     = () => index;
        Math.random          = () => randVal;
        Mutations.getRandCmd = () => randCmd;
    });
    afterEach(() => {
        Helper.probIndex     = probIndex;
        Math.random          = random;
        Mutations.getRandCmd = getRand;
    });

    it('Checks mutate() method with "change" mutation', () => {
        const cmd   = Mutations.getRandCmd;
        const org   = new Organism(1, 2, 3, 0, 1000);
        org.code    = [Config.CODE_CMD_OFFS, Config.CODE_CMD_OFFS + 1];
        org.percent = .5;
        randCmd     = 123;

        Mutations.mutate(org);
        expect(org.code[1]).toBe(randCmd);
    });
});