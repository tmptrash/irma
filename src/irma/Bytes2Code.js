/**
 * Converts byte code of "line" language to human readable assembler like text.
 *
 * @author flatline
 */
const Config                = require('./../Config');
const Organism              = require('./Organism');
/**
 * {Number} Offset of the first command. Before it, just numbers
 */
const CODE_PAD_SIZE         = 30;
const CODE_8_BIT_RESET_MASK = Config.CODE_8_BIT_RESET_MASK;
const CODE_8_BIT_MASK       = Config.CODE_8_BIT_MASK;
//
// Basic commands
//
const TOGGLE                = Config.CODE_CMDS.TOGGLE;
const EQ                    = Config.CODE_CMDS.EQ;
const NOP                   = Config.CODE_CMDS.NOP;
const ADD                   = Config.CODE_CMDS.ADD;
const SUB                   = Config.CODE_CMDS.SUB;
const MUL                   = Config.CODE_CMDS.MUL;
const DIV                   = Config.CODE_CMDS.DIV;
const INC                   = Config.CODE_CMDS.INC;
const DEC                   = Config.CODE_CMDS.DEC;
const RSHIFT                = Config.CODE_CMDS.RSHIFT;
const LSHIFT                = Config.CODE_CMDS.LSHIFT;
const RAND                  = Config.CODE_CMDS.RAND;
const IFP                   = Config.CODE_CMDS.IFP;
const IFN                   = Config.CODE_CMDS.IFN;
const IFZ                   = Config.CODE_CMDS.IFZ;
const IFG                   = Config.CODE_CMDS.IFG;
const IFL                   = Config.CODE_CMDS.IFL;
const IFE                   = Config.CODE_CMDS.IFE;
const IFNE                  = Config.CODE_CMDS.IFNE;
const LOOP                  = Config.CODE_CMDS.LOOP;
const CALL                  = Config.CODE_CMDS.CALL;
const FUNC                  = Config.CODE_CMDS.FUNC;
const RET                   = Config.CODE_CMDS.RET;
const END                   = Config.CODE_CMDS.END;
const RETAX                 = Config.CODE_CMDS.RETAX;
const AXRET                 = Config.CODE_CMDS.AXRET;
const AND                   = Config.CODE_CMDS.AND;
const OR                    = Config.CODE_CMDS.OR;
const XOR                   = Config.CODE_CMDS.XOR;
const NOT                   = Config.CODE_CMDS.NOT;
const AGE                   = Config.CODE_CMDS.AGE;
const LINE                  = Config.CODE_CMDS.LINE;
const LEN                   = Config.CODE_CMDS.LEN;
const LEFT                  = Config.CODE_CMDS.LEFT;
const RIGHT                 = Config.CODE_CMDS.RIGHT;
const SAVE                  = Config.CODE_CMDS.SAVE;
const LOAD                  = Config.CODE_CMDS.LOAD;
const READ                  = Config.CODE_CMDS.READ;
const CMP                   = Config.CODE_CMDS.CMP;
const BREAK                 = Config.CODE_CMDS.BREAK;
//
// Biological commands
//
const JOIN                  = Config.CODE_CMDS.JOIN;
const SPLIT                 = Config.CODE_CMDS.SPLIT;
const STEP                  = Config.CODE_CMDS.STEP;
const SEE                   = Config.CODE_CMDS.SEE;
const SAY                   = Config.CODE_CMDS.SAY;
const LISTEN                = Config.CODE_CMDS.LISTEN;
const NREAD                 = Config.CODE_CMDS.NREAD;
const GET                   = Config.CODE_CMDS.GET;
const PUT                   = Config.CODE_CMDS.PUT;
const OFFS                  = Config.CODE_CMDS.OFFS;
const COLOR                 = Config.CODE_CMDS.COLOR;
const ANAB                  = Config.CODE_CMDS.ANAB;
const CATAB                 = Config.CODE_CMDS.CATAB;
const MOVE                  = Config.CODE_CMDS.MOVE;
const MOL                   = Config.CODE_CMDS.MOL;
const SMOL                  = Config.CODE_CMDS.SMOL;
const RMOL                  = Config.CODE_CMDS.RMOL;
const LMOL                  = Config.CODE_CMDS.LMOL;
const CMOL                  = Config.CODE_CMDS.CMOL;

class Bytes2Code {
    /**
     * Converts bytes array to array of asm like strings
     * @param {Array} bytes Array of numbers (bytes)
     * @param {Boolean} lines Show or hide lines and molecules
     * @param {Boolean} comment Show or not comments near every line
     * @param {Boolean} info Shows code information at the beginning
     * @param {Boolean} firstLineEmpty adds first empty line before script
     * @return {String} Array of asm like strings
     */
    static toCode(bytes, lines = true, comments = true, info = false, firstLineEmpty = true) {
        //
        // Create fake organism to compile his code to know where
        // blocks are located (func/ifxx/loop...end)
        //
        const org  = new Organism(-1, bytes);
        const offs = org.offs;
        let code   = `${firstLineEmpty ? '\n' : ''}${info ? Bytes2Code._info() : ''}`;
        let span   = '';
        let mol    = 0;

        org.compile();
        for (let b = 0; b < bytes.length; b++) {
            const cmd     = bytes[b] & CODE_8_BIT_RESET_MASK;
            const sep     = lines ? ((bytes[b] & CODE_8_BIT_MASK) ? `${(mol++).toString().padEnd(3)} ` : `${mol.toString().padEnd(3)} `) : '';
            const line    = Bytes2Code.MAP[cmd];
            const comment = comments ? `// ${line[1]}` : '';
            if (cmd === FUNC ||
                cmd === LOOP ||
                cmd === IFP  ||
                cmd === IFN  ||
                cmd === IFZ  ||
                cmd === IFG  ||
                cmd === IFL  ||
                cmd === IFE  ||
                cmd === IFNE) {
                code += `${b ? '\n' : ''}${(b+'').padEnd(5)}${sep}${(span + line[0]).padEnd(CODE_PAD_SIZE)}${comment}`;
                if ((offs[b] || 0) > b + 1) {span += '  '}
                continue;
            } else if (cmd === END) {
                span = span.substr(0, span.length - 2);
            } else if (line === undefined) {
                code += `${b ? '\n' : ''}${(b+'').padEnd(5)}${sep}${span}${cmd}`;
                continue;
            }
            code += `${b ? '\n' : ''}${(b+'').padEnd(5)}${sep}${(span + line[0]).padEnd(CODE_PAD_SIZE)}${comment}`;
        }

        return code;
    }

    /**
     * Returns information related to shorthands used in language. 
     * @return {String} info
     */
    static _info() {
        return [
            'Abbreviations description:',
            '  ax, bx    - data registers',
            '  ret       - commands return value register',
            '  offs      - absolute offset of command in a code',
            '  idx       - index of molecule in a code',
            '  fromIdx   - index of "from" molecule',
            '  toIdx     - index of "to" molecule',
            '  dir       - one of 8 directions (up, right-up, right,...)',
            '  val       - value or number',
            '  freq      - frequency (related to say/listen commands',
            '  cmd():ret - ret contains success of command',
            '',
            ''
        ].join('\n');
    }
}

Bytes2Code.MAP = {
    //
    // "line" language core operators
    //
    [TOGGLE]: ['toggle', 'swap ax,bx'],
    [EQ    ]: ['eq',     'ax=bx'],
    [NOP   ]: ['nop',    'no operation'],
    [ADD   ]: ['add',    'ax+=bx'],
    [SUB   ]: ['sub',    'ax-=bx'],
    [MUL   ]: ['mul',    'ax*=bx'],
    [DIV   ]: ['div',    'ax/=bx'],
    [INC   ]: ['inc',    'ax++'],
    [DEC   ]: ['dec',    'ax--'],
    [RSHIFT]: ['rshift', 'ax>>=1'],
    [LSHIFT]: ['lshift', 'ax<<=1'],
    [RAND  ]: ['rand',   'ax=rand(ax|0..255)'],
    [IFP   ]: ['ifp',    'if ax>0'],
    [IFN   ]: ['ifn',    'if ax<0'],
    [IFZ   ]: ['ifz',    'if ax==0'],
    [IFG   ]: ['ifg',    'if ax>bx'],
    [IFL   ]: ['ifl',    'if ax<bx'],
    [IFE   ]: ['ife',    'if ax==bx'],
    [IFNE  ]: ['ifne',   'if ax!=bx'],
    [LOOP  ]: ['loop',   'ax times'],
    [CALL  ]: ['call',   'calls ax % funcAmount'],
    [FUNC  ]: ['func',   'function'],
    [RET   ]: ['ret',    'return'],
    [END   ]: ['end',    'end func/if/loop'],
    [RETAX ]: ['retax',  'ax=ret'],
    [AXRET ]: ['axret',  'ret=ax'],
    [AND   ]: ['and',    'ax&=bx'],
    [OR    ]: ['or',     'ax|=bx'],
    [XOR   ]: ['xor',    'ax^=bx'],
    [NOT   ]: ['not',    'ax=~ax'],
    [AGE   ]: ['age',    'ax=org.age'],
    [LINE  ]: ['line',   'ax=org.line'],
    [LEN   ]: ['len',    'ax=org.code.length'],
    [LEFT  ]: ['left',   'org.memPos--'],
    [RIGHT ]: ['right',  'org.memPos++'],
    [SAVE  ]: ['save',   'org.mem[org.memPos] = ax'],
    [LOAD  ]: ['load',   'ax = org.mem[org.memPos]'],
    [READ  ]: ['read',   'ax = read(ax)'],
    [CMP   ]: ['cmp',    'cmp(ax=fromIdx,bx=toIdx):ret'],
    [BREAK ]: ['break',  'breaks from loop'],
    //
    // Biological stuff
    //
    [JOIN  ]: ['join',   'join(ax=dir):ret'],
    [SPLIT ]: ['split',  'plit(ax=fromIdx,bx=toIdx,ret=dir):ret'],
    [STEP  ]: ['step',   'step(ax=dir):ret'],
    [SEE   ]: ['see',    'ax=see(offs+ax)'],
    [SAY   ]: ['say',    'ax=say(ax=val,bx=freq)'],
    [LISTEN]: ['listen', 'ax=listen(bx=freq)'],
    [NREAD ]: ['nread',  'ax=nread(ax=dir,bx=offs):ret'],
    [GET   ]: ['get',    'get(ax:dir)'],
    [PUT   ]: ['put',    'put(ax:dir)'],
    [OFFS  ]: ['offs',   'ax=org.offset'],
    [COLOR ]: ['color',  'org.color=ax % 0xffffff'],
    [ANAB  ]: ['anab',   'anab(ax:fromIdx, bx:toIdx):ret'],
    [CATAB ]: ['catab',  'catab(ax:offs):ret'],
    [MOVE  ]: ['move',   'move(ax:fromIdx):ret'],
    [MOL   ]: ['mol',    'ax,bx=mol()'],
    [SMOL  ]: ['smol',   'mol=smol(ax)'],
    [RMOL  ]: ['rmol',   'mol=rmol():ret'],
    [LMOL  ]: ['lmol',   'mol=lmol():ret'],
    [CMOL  ]: ['cmol',   'cmol():ret']
};

module.exports = Bytes2Code;