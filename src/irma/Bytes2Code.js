/**
 * Converts byte code to human readable code
 *
 * @author flatline
 */
const Config = require('./../Config');
/**
 * {Number} Offset of the first command. Before it, just numbers
 */
const CODE_CMD_OFFS = Config.CODE_CMD_OFFS;

class Bytes2Code {
    /**
     * Does bytes to code conversion
     * @param {Array} bytes Array of numbers (bytes)
     */
    static toCode(bytes) {
        let code = '\n';
        for (let b = 0; b < bytes.length; b++) {
            if (Bytes2Code.MAP[bytes[b]] === undefined) {
                code += `${b ? '\n' : ''}${bytes[b]}`;
                continue;
            }
            code += `${b ? '\n' : ''}${Bytes2Code.MAP[bytes[b]]}`;
        }

        return code;
    }
}

Bytes2Code.MAP = {
    [CODE_CMD_OFFS     ]: 'step  // d - direction',
    [CODE_CMD_OFFS + 1 ]: 'eat   // d - direction',
    [CODE_CMD_OFFS + 2 ]: 'clone // d - direction',
    [CODE_CMD_OFFS + 3 ]: 'see   // d - offset',
    [CODE_CMD_OFFS + 4 ]: 'dtoa  // a = d',
    [CODE_CMD_OFFS + 5 ]: 'dtob  // b = d',
    [CODE_CMD_OFFS + 6 ]: 'atod  // d = a',
    [CODE_CMD_OFFS + 7 ]: 'btod  // d = b',
    [CODE_CMD_OFFS + 8 ]: 'add   // d = a + b',
    [CODE_CMD_OFFS + 9 ]: 'sub   // d = a - b',
    [CODE_CMD_OFFS + 10]: 'mul   // d = a * b',
    [CODE_CMD_OFFS + 11]: 'div   // d = a / b',
    [CODE_CMD_OFFS + 12]: 'inc   // d++',
    [CODE_CMD_OFFS + 13]: 'dec   // d--',
    [CODE_CMD_OFFS + 14]: 'jump  // jump d',
    [CODE_CMD_OFFS + 15]: 'jumpg // jump d if a > b',
    [CODE_CMD_OFFS + 16]: 'jumpl // jump d if a <= b',
    [CODE_CMD_OFFS + 17]: 'jumpz // jump d if a === 0',
    [CODE_CMD_OFFS + 18]: 'nop',
    [CODE_CMD_OFFS + 19]: 'mget  // a = mem[d]',
    [CODE_CMD_OFFS + 20]: 'mput  // mem[d] = a',
    [CODE_CMD_OFFS + 21]: 'x     // d = org.x',
    [CODE_CMD_OFFS + 22]: 'y     // d = org.y',
    [CODE_CMD_OFFS + 23]: `rand  // d = rand(${-CODE_CMD_OFFS}...${CODE_CMD_OFFS})`
};

module.exports = Bytes2Code;