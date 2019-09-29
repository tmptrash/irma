/**
 * Converts byte code of "line" language to human readable assembler like text.
 *
 * @author flatline
 */
const Config   = require('./../Config');
const Organism = require('./Organism');
/**
 * {Number} Offset of the first command. Before it, just numbers
 */
const CODE_CMD_OFFS = Config.CODE_CMD_OFFS;
const CODE_PAD_SIZE = 30;

class Bytes2Code {
    /**
     * Converts bytes array to array of asm like strings
     * @param {Array} bytes Array of numbers (bytes)
     * @param {Number} pad End pad size
     * @param {Boolean} firstLineEmpty adds first empty line before script
     * @return {String} Array of asm like strings
     */
    static toCode(bytes, pad = CODE_PAD_SIZE, firstLineEmpty = true) {
        //
        // Create fake organism to preprocess his code to know where
        // blocks are located (func/ifxx/loop...end)
        //
        const org = new Organism(-1, -1, -1, null, bytes, true);

        const offs = org.offs;
        let code   = firstLineEmpty ? '\n' : '';
        let span   = '';
        for (let b = 0; b < bytes.length; b++) {
            const line = Bytes2Code.MAP[bytes[b]];
            if (bytes[b] === CODE_CMD_OFFS + 24 || // func
                bytes[b] === CODE_CMD_OFFS + 22 || // loop
                bytes[b] === CODE_CMD_OFFS + 15 || // ifp
                bytes[b] === CODE_CMD_OFFS + 16 || // ifn
                bytes[b] === CODE_CMD_OFFS + 17 || // ifz
                bytes[b] === CODE_CMD_OFFS + 18 || // ifg
                bytes[b] === CODE_CMD_OFFS + 19 || // ifl
                bytes[b] === CODE_CMD_OFFS + 20 || // ife
                bytes[b] === CODE_CMD_OFFS + 21) { // ifne
                code += `${b ? '\n' : ''}${(b+'').padEnd(5)}${(span + line[0]).padEnd(CODE_PAD_SIZE)}// ${line[1]}`;
                if (offs[b] > b + 1) {span += '  '}
                continue;
            } else if (bytes[b] === CODE_CMD_OFFS + 26) { // end
                span = span.substr(0, span.length - 2);
            } else if (line === undefined) {
                code += `${b ? '\n' : ''}${(b+'').padEnd(5)}${span}${bytes[b]}`;
                continue;
            }
            code += `${b ? '\n' : ''}${(b+'').padEnd(5)}${(span + line[0]).padEnd(CODE_PAD_SIZE)}// ${line[1]}`;
        }

        return code;
    }
}

Bytes2Code.MAP = {
    [CODE_CMD_OFFS     ]: ['toggle', 'swap ax,bx'],
    [CODE_CMD_OFFS + 1 ]: ['shift',  'shifts ax,bx'],
    [CODE_CMD_OFFS + 2 ]: ['eq',     'ax=bx'],
    [CODE_CMD_OFFS + 3 ]: ['pop',    'ax=stack.pop()'],
    [CODE_CMD_OFFS + 4 ]: ['push',   'stack.push(ax)'],
    [CODE_CMD_OFFS + 5 ]: ['nop',    'do nothing'],
    [CODE_CMD_OFFS + 6 ]: ['add',    'ax+=bx'],
    [CODE_CMD_OFFS + 7 ]: ['sub',    'ax-=bx'],
    [CODE_CMD_OFFS + 8 ]: ['mul',    'ax*=bx'],
    [CODE_CMD_OFFS + 9 ]: ['div',    'ax/=bx'],
    [CODE_CMD_OFFS + 10]: ['inc',    'ax++'],
    [CODE_CMD_OFFS + 11]: ['dec',    'ax--'],
    [CODE_CMD_OFFS + 12]: ['rshift', 'ax>>=1'],
    [CODE_CMD_OFFS + 13]: ['lshift', 'ax<<=1'],
    [CODE_CMD_OFFS + 14]: ['rand',   `ax=rand(${-CODE_CMD_OFFS}...${CODE_CMD_OFFS})`],
    [CODE_CMD_OFFS + 15]: ['ifp',    'if ax>0'],
    [CODE_CMD_OFFS + 16]: ['ifn',    'if ax<0'],
    [CODE_CMD_OFFS + 17]: ['ifz',    'if ax==0'],
    [CODE_CMD_OFFS + 18]: ['ifg',    'if ax>bx'],
    [CODE_CMD_OFFS + 19]: ['ifl',    'if ax<bx'],
    [CODE_CMD_OFFS + 20]: ['ife',    'if ax==bx'],
    [CODE_CMD_OFFS + 21]: ['ifne',   'if ax!=bx'],
    [CODE_CMD_OFFS + 22]: ['loop',   'ax times'],
    [CODE_CMD_OFFS + 23]: ['call',   'calls ax % funcAmount'],
    [CODE_CMD_OFFS + 24]: ['func',   'function'],
    [CODE_CMD_OFFS + 25]: ['ret',    'return'],
    [CODE_CMD_OFFS + 26]: ['end',    'end func/if/loop'],
    [CODE_CMD_OFFS + 27]: ['retax',  'ax=ret'],
    [CODE_CMD_OFFS + 28]: ['axret',  'ret=ax'],
    [CODE_CMD_OFFS + 29]: ['and',    'ax&=bx'],
    [CODE_CMD_OFFS + 30]: ['or',     'ax|=bx'],
    [CODE_CMD_OFFS + 31]: ['xor',    'ax^=bx'],
    [CODE_CMD_OFFS + 32]: ['not',    'ax=~ax'],

    [CODE_CMD_OFFS + 33]: ['join',   'ret=join(ax:dir,bx:offs)'],
    [CODE_CMD_OFFS + 34]: ['split',  'ret=split(ax:from,bx:to,ret:dir)'],
    [CODE_CMD_OFFS + 35]: ['step',   'step(ax:dir)'],
    [CODE_CMD_OFFS + 36]: ['find',   'ax=find(ax:cmd|offs1,bx=-1|offs2):ret'],
    [CODE_CMD_OFFS + 37]: ['move',   'move(ax:offs):ret'],
    [CODE_CMD_OFFS + 38]: ['see',    'ax=see(ax:offs)'],
    [CODE_CMD_OFFS + 39]: ['say',    'ax=say(ax:val,bx:freq)'],
    [CODE_CMD_OFFS + 40]: ['listen', 'ax:val,ret:dir=listen(bx:freq)'],
    [CODE_CMD_OFFS + 41]: ['nread',  'ax=nread(ax:dir,bx:offs)'],
    [CODE_CMD_OFFS + 42]: ['nsplit', 'nsplit(ax:dir,bx:offs,ret:offs):ret'],
    [CODE_CMD_OFFS + 43]: ['get',    'get(ax:dir)'],
    [CODE_CMD_OFFS + 44]: ['put',    'put(ax:dir)'],
    [CODE_CMD_OFFS + 45]: ['offs',   'ax=org.offset'],
    [CODE_CMD_OFFS + 46]: ['age',    'ax=org.age'],
    [CODE_CMD_OFFS + 47]: ['line',   'ax=org.line'],
    [CODE_CMD_OFFS + 48]: ['len',    'ax=org.code.length'],
    [CODE_CMD_OFFS + 49]: ['color',  'org.color=ax % 0xffffff']
};

module.exports = Bytes2Code;