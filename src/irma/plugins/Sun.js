/**
 * Sun analog. Adds energy to the system by joining small molecules into big.
 * Organisms should use catabolism to obtain energy from these bounds. It also
 * splits big chains into separate dots.
 * 
 * @plugin
 * @author flatline
 */
const Helper            = require('../../common/Helper');
const Config            = require('../../Config');
const Organism          = require('../Organism');
/**
 * {Array} Array of increments. Using it we may obtain coordinates of the
 * point depending on one of 8 directions. We use these values in any command
 * related to sight, moving and so on
 */
const DIRS              = Config.DIRS;
const WIDTH             = Config.WORLD_WIDTH - 1;
const HEIGHT            = Config.WORLD_HEIGHT - 1;
const WIDTH1            = WIDTH + 1;
const HEIGHT1           = HEIGHT + 1;
const MAX_OFFS          = WIDTH1 * HEIGHT1 - 1;
const MASK8R            = Config.CODE_8_BIT_RESET_MASK;
const MASK8             = Config.CODE_8_BIT_MASK;
const rand              = Helper.rand;

class Sun {
    /**
     * Stores all needed properties from VM class
     * @param {VM} vm Virtual Machine instance
     */
    constructor(vm) {
        this._vm     = vm;
        this._dir    = 0;
        this._offset = 0;
        this._index  = -1;

        this._onAfterRepeatCb = this._onAfterRepeat.bind(this);
        Helper.override(vm, 'afterRepeat', this._onAfterRepeatCb);
    }

    destroy() {
        Helper.unoverride(this._vm, 'afterRepeat', this._onAfterRepeatCb);
        this._vm    = null;
        this._index = 0;
    }

    _onAfterRepeat() {
        if (this._vm.iteration % Config.molSunPeriod !== 0) {return}

        const orgsMols = this._vm.orgsMols;
        if (orgsMols.full) {return}                // No free slots for new molecules
        const molSize  = Config.molCodeSize;
        let mol;
        let j;
        let offset;
        const tries = 10;
        for (j = 0; j < tries; j++) {
            if (++this._index >= orgsMols.items) {this._index = 0}
            mol = orgsMols.get(this._index);
            if (mol instanceof Organism) {continue} // Skip organisms
            if (mol.code.length <= molSize + rand(molSize)) {this.incMol(mol); return}
            offset = this._getNearFreePos(mol);
            if (offset === -1) {continue}           // No free near space
            break;
        }
        if (j === tries) {return}
        //
        // This line moves index back to current item to join it till the end.
        // It's good for big (with long code) molecules
        //
        this._index--;
        
        const newCode = mol.code.subarray(0, molSize);
        for (let i = 0, l = newCode.length - 1; i < l; i++) {newCode[i] &= MASK8R}
        newCode[molSize - 1] |= MASK8;
        mol.code = mol.code.splice(0, molSize);
        this._vm.addMol(offset, newCode);
    }

    /**
     * Try to get free position near specified organism
     * @param {Organism} mol
     * @return {Number} Offset
     */
    _getNearFreePos(mol) {
        const world = this._vm.world;
        if (this._offset === 0) {this._offset = mol.offset}

        for (let i = 0; i < 8; i++) {
            if (++this._dir > 7) {this._dir = 0}
            const offset = this._offset + DIRS[this._dir];
            if (offset > 0 && offset < MAX_OFFS && world.index(offset) === -1) {return offset}
        }

        this._offset = this._offset + DIRS[rand(8)] * 6;
        for (let i = 0; i < 8; i++) {
            if (++this._dir > 7) {this._dir = 0}
            const offset = this._offset + DIRS[this._dir];
            if (offset > 0 && offset < MAX_OFFS && world.index(offset) === -1) {return offset}
        }

        this._offset = mol.offset;
        return -1;
    }

    incMol(mol) {
        const code = mol.code;
        for (let i = 0, l = code.length; i < l; i++) {code[i] &= MASK8R}
        code[code.length - 1] |= MASK8;
    }
}

module.exports = Sun;