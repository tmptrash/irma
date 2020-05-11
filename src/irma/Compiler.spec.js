describe('src/irma/Bytes2Code', () => {
    const Bytes2Code    = require('./Bytes2Code');
    const Config        = require('../Config');
    const CODE_CMD_OFFS = Config.CODE_CMD_OFFS;

    it('Checks constant number command', () => {
        expect(Bytes2Code.toCode([CODE_CMD_OFFS - 1])).toBe(`\n${CODE_CMD_OFFS - 1}`);
        expect(Bytes2Code.toCode([CODE_CMD_OFFS - 2])).toBe(`\n${CODE_CMD_OFFS - 2}`);
        expect(Bytes2Code.toCode([0])).toBe(`\n${0}`);
        expect(Bytes2Code.toCode([-1])).toBe(`\n${-1}`);
        expect(Bytes2Code.toCode([-CODE_CMD_OFFS])).toBe(`\n${-CODE_CMD_OFFS}`);
    });

    it('Checks non constant commands', () => {
        for (let i = 0, len = Object.keys(Bytes2Code.MAP).length; i < len; i++) {
            expect(Bytes2Code.toCode([CODE_CMD_OFFS + i])).toBe(`\n${Bytes2Code.MAP[CODE_CMD_OFFS + i]}`);
            expect(Bytes2Code.toCode([CODE_CMD_OFFS + i, CODE_CMD_OFFS + i])).toBe(`\n${Bytes2Code.MAP[CODE_CMD_OFFS + i]}\n${Bytes2Code.MAP[CODE_CMD_OFFS + i]}`);
        }
    });
});