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
const COMMENT               = Config.CODE_COMMENT_SYMBOL;
const MOL_STR               = Config.CODE_MOL_STR;
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
const REAX                  = Config.CODE_CMDS.REAX;
const NAND                  = Config.CODE_CMDS.NAND;
const AGE                   = Config.CODE_CMDS.AGE;
const LINE                  = Config.CODE_CMDS.LINE;
const LEN                   = Config.CODE_CMDS.LEN;
const LEFT                  = Config.CODE_CMDS.LEFT;
const RIGHT                 = Config.CODE_CMDS.RIGHT;
const SAVE                  = Config.CODE_CMDS.SAVE;
const LOAD                  = Config.CODE_CMDS.LOAD;
const READ                  = Config.CODE_CMDS.READ;
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
const MOL                   = Config.CODE_CMDS.MOL;
const MMOL                  = Config.CODE_CMDS.MMOL;
const SMOL                  = Config.CODE_CMDS.SMOL;
const RMOL                  = Config.CODE_CMDS.RMOL;
const LMOL                  = Config.CODE_CMDS.LMOL;
const CMOL                  = Config.CODE_CMDS.CMOL;
const MCMP                  = Config.CODE_CMDS.MCMP;
const W2MOL                 = Config.CODE_CMDS.W2MOL;
const MOL2W                 = Config.CODE_CMDS.MOL2W;
const FIND                  = Config.CODE_CMDS.FIND;

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
        const org     = new Organism(-1, bytes);
        org.compile();
        const offs    = org.offs;
        const padSize = lines ? CODE_PAD_SIZE : 0;
        let code      = `${firstLineEmpty ? '\n' : ''}${info ? Bytes2Code._info() : ''}`;
        let span      = '';
        let mol       = 0;

        for (let b = 0; b < bytes.length; b++) {
            const isMol   = bytes[b] & CODE_8_BIT_MASK;
            const molStr  = isMol ? '@mol' : '    ';
            const cmd     = bytes[b] & CODE_8_BIT_RESET_MASK;
            const molIdx  = lines ? (isMol ? `${(mol++).toString().padEnd(3)} ` : `${mol.toString().padEnd(3)} `) : '';
            const line    = Bytes2Code.MAP[cmd];
            const lineIdx = lines ? `${b ? '\n' : ''}${(b.toString()).padEnd(5)}` : (b ? '\n' : '');
            const comment = comments && line ? `// ${line[1]}` : '';
            if (cmd === FUNC ||
                cmd === LOOP ||
                cmd === IFP  ||
                cmd === IFN  ||
                cmd === IFZ  ||
                cmd === IFG  ||
                cmd === IFL  ||
                cmd === IFE  ||
                cmd === IFNE) {
                code += `${lineIdx}${molIdx}${(span + line[0]).padEnd(padSize)} ${molStr}${comment}`;
                if ((offs[b] || 0) > b + 1) {span += '  '}
                continue;
            } else if (cmd === END) {
                span = span.substr(0, span.length - 2);
            } else if (line === undefined) { // number constant
                code += `${lineIdx}${molIdx}${span}${cmd} ${molStr}`;
                continue;
            }
            code += `${lineIdx}${molIdx}${(span + line[0]).padEnd(padSize)} ${molStr}${comment}`;
        }

        return code;
    }

    /**
     * Converts string code to byte code array
     * @param {String} code String code
     * @return {Array} Byte code
     */
    static toByteCode(code) {
        const splitted = code.split('\n');
        const len      = splitted.length;
        const bCode    = [];

        for (let i = 0; i < len; i++) {
            const byte = this.byte(splitted[i]);
            byte !== null && bCode.push(byte);
        }

        return Uint8Array.from(bCode);
    }

    /**
     * Parses a line and returns a command without spaces, comments and all other stuff
     * @param {String} line One script line
     * @return {String|null} cmd or null
     */
    static byte(line) {
        const isMol = line.indexOf(MOL_STR) !== -1;
        const ln    = line.split(isMol ? MOL_STR : COMMENT)[0].trim();
        const byte  = this._isNumeric(ln) ? +ln : this.CMD_MAP[ln];
        if (byte === undefined) {return null}
        return isMol ? byte | CODE_8_BIT_MASK : byte;
    }

    /**
     * Checks if one script code line valid
     * @param {String} line One code line
     * @return {Boolean} valid status
     */
    static valid(line) {
        const isMol = line.indexOf(MOL_STR) !== -1;
        const ln    = line.split(isMol ? MOL_STR : COMMENT)[0].trim();
        return ln === '' || (this._isNumeric(ln) ? true : !!this.CMD_MAP[ln]);
    }

    /**
     * checks if specified line of code is a last atom in a molecule
     * @param {String} line One code line
     * @return {Boolean} Last or not
     */
    static isMol(line) {
        return line.indexOf(MOL_STR) !== -1;
    }

    /**
     * Returns information related to shorthands used in language. 
     * @return {String} info
     */
    static _info() {
        return [
            'Abbreviations description:',
            '  ax, bx    - data registers',
            '  re        - commands return value register',
            '  offs      - absolute offset of command in a code',
            '  idx       - index of molecule in a code',
            '  fromIdx   - index of "from" molecule',
            '  toIdx     - index of "to" molecule',
            '  dir       - one of 8 directions (up, right-up, right,...)',
            '  val       - value or number',
            '  freq      - frequency (related to say/listen commands',
            '  cmd():re  - re contains success of command',
            '',
            ''
        ].join('\n');
    }

    /**
     * Checks if specified argument is numerical or not
     * @param {*} n Value to check
     * @return {Boolean} Is numeric
     */
    static _isNumeric(n) {
        // eslint-disable-next-line no-restricted-globals
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    /**
     * Returns commands map, where keys are string commands and
     * values are their numeric codes
     * @return {Object} Commands map
     */
    static _getCmdMap() {
        const map    = Bytes2Code.MAP;
        const cmdMap = {};
        const keys   = Object.keys(map);

        for (let i = 0, len = keys.length; i < len; i++) {
            cmdMap[map[keys[i]][0]] = +keys[i];
        }

        return cmdMap;
    }
}

/**
 * {Object} Map of all available commands. Is used during byte
 * code to human readable code convertion
 */
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
    [REAX  ]: ['reax',   'ax=re'],
    [NAND  ]: ['nand',   'ax=nand(ax,bx)'],
    [AGE   ]: ['age',    'ax=org.age'],
    [LINE  ]: ['line',   'ax=org.line'],
    [LEN   ]: ['len',    'ax=org.code.length'],
    [LEFT  ]: ['left',   'org.memPos--'],
    [RIGHT ]: ['right',  'org.memPos++'],
    [SAVE  ]: ['save',   'org.mem[org.memPos] = ax'],
    [LOAD  ]: ['load',   'ax = org.mem[org.memPos]'],
    [READ  ]: ['read',   'ax = read(ax)'],
    [BREAK ]: ['break',  'breaks from loop'],
    //
    // Biological stuff
    //
    [JOIN  ]: ['join',   'join(ax=dir):re'],
    [SPLIT ]: ['split',  'plit(ax=fromIdx,bx=toIdx,re=dir):re'],
    [STEP  ]: ['step',   'step(ax=dir):re'],
    [SEE   ]: ['see',    'ax=see(offs+ax)'],
    [SAY   ]: ['say',    'ax=say(ax=val,bx=freq)'],
    [LISTEN]: ['listen', 'ax=listen(bx=freq)'],
    [NREAD ]: ['nread',  'ax=nread(ax=dir,bx=offs):re'],
    [GET   ]: ['get',    'get(ax:dir)'],
    [PUT   ]: ['put',    'put(ax:dir)'],
    [OFFS  ]: ['offs',   'ax=org.offset'],
    [COLOR ]: ['color',  'org.color=ax % 0xffffff'],
    [ANAB  ]: ['anab',   'anab(ax:fromIdx, bx:toIdx):re'],
    [CATAB ]: ['catab',  'catab(ax:offs):re'],
    [MOL   ]: ['mol',    'ax,bx=mol()'],
    [MMOL  ]: ['mmol',   'mmol(ax=fromIdx):re'],
    [SMOL  ]: ['smol',   'mol=smol(ax)'],
    [RMOL  ]: ['rmol',   'mol=rmol():re'],
    [LMOL  ]: ['lmol',   'mol=lmol():re'],
    [CMOL  ]: ['cmol',   'cmol():re'],
    [MCMP  ]: ['mcmp',    'mcmp():re'],
    [W2MOL ]: ['w2mol',  'molWrite=mol'],
    [MOL2W ]: ['mol2w',  'mol=molWrite'],
    [FIND  ]: ['find',   'ax=find(ax=fromIdx,bx=toIdx):re']
};

/**
 * {Object} Commands map. Inverted map, where keys are string 
 * commands and values are their numeric codes
 */
Bytes2Code.CMD_MAP = Bytes2Code._getCmdMap();

module.exports = Bytes2Code;