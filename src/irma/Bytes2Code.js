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
     * @param {Boolean} info Shows code information at the beginning
     * @param {Boolean} firstLineEmpty adds first empty line before script
     * @return {String} Array of asm like strings
     */
    static toCode(bytes, info = false, firstLineEmpty = true) {
        //
        // Create fake organism to compile his code to know where
        // blocks are located (func/ifxx/loop...end)
        //
        const org  = new Organism(-1, bytes);
        const offs = org.offs;
        let code   = `${firstLineEmpty ? '\n' : ''}${info ? this._info() : ''}`;
        let span   = '';

        org.compile();
        for (let b = 0; b < bytes.length; b++) {
            const line = Bytes2Code.MAP[bytes[b]];
            if (bytes[b] === CODE_CMD_OFFS + 22 || // func
                bytes[b] === CODE_CMD_OFFS + 20 || // loop
                bytes[b] === CODE_CMD_OFFS + 13 || // ifp
                bytes[b] === CODE_CMD_OFFS + 14 || // ifn
                bytes[b] === CODE_CMD_OFFS + 15 || // ifz
                bytes[b] === CODE_CMD_OFFS + 16 || // ifg
                bytes[b] === CODE_CMD_OFFS + 17 || // ifl
                bytes[b] === CODE_CMD_OFFS + 18 || // ife
                bytes[b] === CODE_CMD_OFFS + 19) { // ifne
                code += `${b ? '\n' : ''}${(b+'').padEnd(5)}${(span + line[0]).padEnd(CODE_PAD_SIZE)}// ${line[1]}`;
                if (offs[b] > b + 1) {span += '  '}
                continue;
            } else if (bytes[b] === CODE_CMD_OFFS + 24) { // end
                span = span.substr(0, span.length - 2);
            } else if (line === undefined) {
                code += `${b ? '\n' : ''}${(b+'').padEnd(5)}${span}${bytes[b]}`;
                continue;
            }
            code += `${b ? '\n' : ''}${(b+'').padEnd(5)}${(span + line[0]).padEnd(CODE_PAD_SIZE)}// ${line[1]}`;
        }

        return code;
    }

    /**
     * Returns information related to shorthands used in language. 
     * @return {String} info
     */
    static _info() {
        return [
            'ax, bx    - data registers',
            'ret       - commands return value register',
            'offs      - absolute offset of command in a code',
            'idx       - index of molecule in a code',
            'fromIdx   - index of "from" molecule',
            'toIdx     - index of "to" molecule',
            'dir       - one of 8 directions (up, right-up, right,...)',
            'val       - value or number',
            'freq      - frequency (related to say/listen commands',
            'cmd():ret - ret contains success of command',
            ''
        ].join('\n');
    }
}

Bytes2Code.MAP = {
    //
    // "line" language core operators
    //
    [CODE_CMD_OFFS     ]: ['toggle', 'swap ax,bx'],
    [CODE_CMD_OFFS + 1 ]: ['eq',     'ax=bx'],
    [CODE_CMD_OFFS + 2 ]: ['nop',    'no operation'],
    [CODE_CMD_OFFS + 3 ]: ['add',    'ax+=bx'],
    [CODE_CMD_OFFS + 4 ]: ['sub',    'ax-=bx'],
    [CODE_CMD_OFFS + 5 ]: ['mul',    'ax*=bx'],
    [CODE_CMD_OFFS + 6 ]: ['div',    'ax/=bx'],
    [CODE_CMD_OFFS + 7 ]: ['inc',    'ax++'],
    [CODE_CMD_OFFS + 8 ]: ['dec',    'ax--'],
    [CODE_CMD_OFFS + 9 ]: ['rshift', 'ax>>=1'],
    [CODE_CMD_OFFS + 10]: ['lshift', 'ax<<=1'],
    [CODE_CMD_OFFS + 11]: ['rand',   'ax=rand(ax|0..255'],
    [CODE_CMD_OFFS + 12]: ['ifp',    'if ax>0'],
    [CODE_CMD_OFFS + 13]: ['ifn',    'if ax<0'],
    [CODE_CMD_OFFS + 14]: ['ifz',    'if ax==0'],
    [CODE_CMD_OFFS + 15]: ['ifg',    'if ax>bx'],
    [CODE_CMD_OFFS + 16]: ['ifl',    'if ax<bx'],
    [CODE_CMD_OFFS + 17]: ['ife',    'if ax==bx'],
    [CODE_CMD_OFFS + 18]: ['ifne',   'if ax!=bx'],
    [CODE_CMD_OFFS + 19]: ['loop',   'ax times'],
    [CODE_CMD_OFFS + 20]: ['call',   'calls ax % funcAmount'],
    [CODE_CMD_OFFS + 21]: ['func',   'function'],
    [CODE_CMD_OFFS + 22]: ['ret',    'return'],
    [CODE_CMD_OFFS + 23]: ['end',    'end func/if/loop'],
    [CODE_CMD_OFFS + 24]: ['retax',  'ax=ret'],
    [CODE_CMD_OFFS + 25]: ['axret',  'ret=ax'],
    [CODE_CMD_OFFS + 26]: ['and',    'ax&=bx'],
    [CODE_CMD_OFFS + 27]: ['or',     'ax|=bx'],
    [CODE_CMD_OFFS + 28]: ['xor',    'ax^=bx'],
    [CODE_CMD_OFFS + 29]: ['not',    'ax=~ax'],
    [CODE_CMD_OFFS + 30]: ['age',    'ax=org.age'],
    [CODE_CMD_OFFS + 31]: ['line',   'ax=org.line'],
    [CODE_CMD_OFFS + 32]: ['len',    'ax=org.code.length'],
    [CODE_CMD_OFFS + 33]: ['left',   'org.memPos--'],
    [CODE_CMD_OFFS + 34]: ['right',  'org.memPos++'],
    [CODE_CMD_OFFS + 35]: ['save',   'org.mem[org.memPos] = ax'],
    [CODE_CMD_OFFS + 36]: ['load',   'ax = org.mem[org.memPos]'],
    //
    // Biological stuff
    //
    [CODE_CMD_OFFS + 37]: ['join',   'join(ax=dir):ret'],
    [CODE_CMD_OFFS + 38]: ['split',  'plit(ax=fromIdx,bx=toIdx,ret=dir):ret'],
    [CODE_CMD_OFFS + 39]: ['step',   'step(ax=dir):ret'],
    [CODE_CMD_OFFS + 40]: ['see',    'ax=see(offs+ax)'],
    [CODE_CMD_OFFS + 41]: ['say',    'ax=say(ax=val,bx=freq)'],
    [CODE_CMD_OFFS + 42]: ['listen', 'ax=listen(bx=freq)'],
    [CODE_CMD_OFFS + 43]: ['nread',  'ax=nread(ax=dir,bx=offs):ret'],
    [CODE_CMD_OFFS + 44]: ['nsplit', 'nsplit(ax:dir,bx:offs,ret:offs):ret'],
    [CODE_CMD_OFFS + 45]: ['get',    'get(ax:dir)'],
    [CODE_CMD_OFFS + 46]: ['put',    'put(ax:dir)'],
    [CODE_CMD_OFFS + 47]: ['offs',   'ax=org.offset'],
    [CODE_CMD_OFFS + 48]: ['color',  'org.color=ax % 0xffffff'],
    [CODE_CMD_OFFS + 49]: ['anab',   'anab(ax:fromIdx, bx:toIdx):ret'],
    [CODE_CMD_OFFS + 50]: ['catab',  'catab(ax:offs):ret'],
    [CODE_CMD_OFFS + 51]: ['find',   'ax=find(ax:findIdx,bx:fromIdx,ret:toIdx):ret'],
    [CODE_CMD_OFFS + 52]: ['move',   'move(ax:fromIdx,bx:toIdx):ret']
};

module.exports = Bytes2Code;