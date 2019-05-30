/**
 * Converts byte code to human readable assembler like language.
 *
 * @author flatline
 */
const Config   = require('./../Config');
const Organism = require('./Organism');
/**
 * {Number} Offset of the first command. Before it, just numbers
 */
const CODE_CMD_OFFS = Config.CODE_CMD_OFFS;

class Bytes2Code {
    /**
     * Converts bytes array to array of asm like strings
     * @param {Array} bytes Array of numbers (bytes)
     * @return {String} Array of asm like strings
     */
    static toCode(bytes, firstLineEmpty = true) {
        //
        // Create fake organism to preprocess his code to know where
        // blocks are located (func/ifxx...end)
        //
        const org = new Organism(-1, -1, -1, {}, 0, 1);

        org.code = bytes;
        org.preprocess();

        const offs = org.offs;
        let code   = firstLineEmpty ? '\n' : '';
        let span   = '';
        for (let b = 0; b < bytes.length; b++) {
            if (bytes[b] === CODE_CMD_OFFS + 25 || // func
                bytes[b] === CODE_CMD_OFFS + 14 || // loop
                bytes[b] === CODE_CMD_OFFS + 15 || // ifdga
                bytes[b] === CODE_CMD_OFFS + 16 || // ifdla
                bytes[b] === CODE_CMD_OFFS + 17) { // ifdea
                code += `${b ? '\n' : ''}${span}${Bytes2Code.MAP[bytes[b]]}`;
                if (offs[b] > b + 1) {
                    span += '  ';
                }
                continue;
            } else if (bytes[b] === CODE_CMD_OFFS + 27) { // end
                span = span.substr(0, span.length - 2);
            }
            code += `${b ? '\n' : ''}${span}${Bytes2Code.MAP[bytes[b]]}`;
        }

        return code;
    }
}

Bytes2Code.MAP = {
    [CODE_CMD_OFFS     ]: 'step  // step(dir:d)',
    [CODE_CMD_OFFS + 1 ]: 'eat   // b = eat(dir:d)',
    [CODE_CMD_OFFS + 2 ]: 'clone // b = clone(dir:d)',
    [CODE_CMD_OFFS + 3 ]: 'see   // d = see(x:a,y:b)',
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
    [CODE_CMD_OFFS + 14]: 'loop  // d times',
    [CODE_CMD_OFFS + 15]: 'ifdga // if d > a',
    [CODE_CMD_OFFS + 16]: 'ifdla // if d < a',
    [CODE_CMD_OFFS + 17]: 'ifdea // if d == a',
    [CODE_CMD_OFFS + 18]: 'nop   // do nothing',
    [CODE_CMD_OFFS + 19]: 'mget  // a = mem[d]',
    [CODE_CMD_OFFS + 20]: 'mput  // mem[d] = a',
    [CODE_CMD_OFFS + 21]: 'offs  // d = org.offset',
    [CODE_CMD_OFFS + 22]: `rand  // d = rand(${-CODE_CMD_OFFS}...${CODE_CMD_OFFS})`,
    [CODE_CMD_OFFS + 23]: `call  // calls d % fCount`,
    [CODE_CMD_OFFS + 24]: `func  // function`,
    [CODE_CMD_OFFS + 25]: `ret d`,
    [CODE_CMD_OFFS + 26]: `end   // end func/if/loop`,
    [CODE_CMD_OFFS + 27]: `get   // b = get(dir:d)`,
    [CODE_CMD_OFFS + 28]: `put   // b = put(d)`,
    [CODE_CMD_OFFS + 29]: `mix   // b = mix(dir:d, packet)`
};

module.exports = Bytes2Code;