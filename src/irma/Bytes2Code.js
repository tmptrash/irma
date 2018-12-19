/**
 * Converts byte code to human readable code
 *
 * @author flatline
 */
const Config = require('./../Config');
/**
 * {Number} Offset of the first command. Before it, just numbers
 */
const CMD_OFFS = Config.CMD_OFFS;

class Bytes2Code {
    /**
     * Does bytes to code conversion
     * @param {Array} bytes Array of numbers (bytes)
     */
    static toCode(bytes) {
        let code = '\n';
        for (let b = 0; b < bytes.length; b++) {
            code += `${b ? '\n' : ''}${Bytes2Code.MAP[bytes[b]]}`;
        }

        return code;
    }
}

Bytes2Code.MAP = {
    [CMD_OFFS     ]: 'step  // d - direction',
    [CMD_OFFS + 1 ]: 'eat   // d - direction',
    [CMD_OFFS + 2 ]: 'clone // d - direction',
    [CMD_OFFS + 3 ]: 'see   // d - direction',
    [CMD_OFFS + 4 ]: 'dtoa  // a = d',
    [CMD_OFFS + 5 ]: 'dtob  // b = d',
    [CMD_OFFS + 6 ]: 'atod  // d = a',
    [CMD_OFFS + 7 ]: 'btod  // d = b',
    [CMD_OFFS + 8 ]: 'add   // d = a + b',
    [CMD_OFFS + 9 ]: 'sub   // d = a - b',
    [CMD_OFFS + 10]: 'mul   // d = a * b',
    [CMD_OFFS + 11]: 'div   // d = a / b',
    [CMD_OFFS + 12]: 'inc   // d++',
    [CMD_OFFS + 13]: 'dec   // d--',
    [CMD_OFFS + 14]: 'jump  // jump d',
    [CMD_OFFS + 15]: 'jumpg // jump d if a > b',
    [CMD_OFFS + 16]: 'jumpl // jump d if a <= b',
    [CMD_OFFS + 17]: 'jumpz // jump d if a === 0',
    [CMD_OFFS + 18]: 'nop',
    [CMD_OFFS + 19]: 'get   // a = mem[d]',
    [CMD_OFFS + 20]: 'put   // mem[d] = a',
    [CMD_OFFS + 21]: 'x     // d = org.x',
    [CMD_OFFS + 22]: 'y     // d = org.y',
};

module.exports = Bytes2Code;