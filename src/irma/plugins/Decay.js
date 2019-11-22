/**
 * Represents molecules decay process. It tooks one molecule and splits it into two,
 * if there is free space near it. One additional dot appears somewhere near current 
 * after that. If the size of molecule is bigger or equal than molCodeSize, then it's 
 * an atom and decay is impossible.
 *  
 * @plugin
 * @author flatline
 */
const Helper            = require('../../common/Helper');
const Config            = require('../../Config');
/**
 * {Array} Array of increments. Using it we may obtain coordinates of the
 * point depending on one of 8 directions. We use these values in any command
 * related to sight, moving and so on
 */
const DIR               = Config.DIR;
const WIDTH             = Config.WORLD_WIDTH - 1;
const HEIGHT            = Config.WORLD_HEIGHT - 1;
const WIDTH1            = WIDTH + 1;
const HEIGHT1           = HEIGHT + 1;
const MAX_OFFS          = WIDTH1 * HEIGHT1 - 1;

class Decay {
    /**
     * Stores all needed properties from VM class
     * @param {VM} vm Virtual Machine instance
     */
    constructor(vm) {
        this._vm    = vm;
        this._index = -1;

        this._onAfterRepeatCb = this._onAfterRepeat.bind(this);
        Helper.override(vm, 'afterRepeat', this._onAfterRepeatCb);
    }

    destroy() {
        Helper.unoverride(this._vm, 'afterRepeat', this._onAfterRepeatCb);
        this._vm    = null;
        this._index = 0;
    }

    _onAfterRepeat() {
        if (this._vm.iteration % Config.molDecayPeriod !== 0) {return}

        const orgsMols = this._vm.orgsMols;
        if (orgsMols.full) {return}
        if (++this._index >= orgsMols.items) {this._index = 0}
        const org = orgsMols.get(this._index);
        const molSize = Config.molCodeSize;
        if (org.energy || org.code.length <= molSize) {return} // Skip organisms
        const offset = this._getNearPos(org);
        const dot = this._vm.world.getOrgIdx(offset);
        if (dot > -1) {return} // organism or molecule on the way
        //
        // This line moves index back to current item to decay it till the end.
        // It's good for big (with long code) molecules
        //
        this._index--;
        
        const newCode = org.code.subarray(0, molSize);
        org.code = org.code.splice(0, molSize);
        this._vm.addOrg(offset, newCode);
    }

    /**
     * Try to get free position near specified organism
     * @param {Organism} org 
     * @return {Number} Offset
     */
    _getNearPos(org) {
        const startOffs = org.offset;
        const mol = org.code[0];
        let offset = startOffs + DIR[Math.floor(mol % 8)] * Math.floor(Math.random() * Config.molDecayDistance);
        if (offset < 0 || offset > MAX_OFFS || this._vm.world.getOrgIdx(offset) > -1) {
            offset = startOffs + DIR[Math.floor(mol % 8)] * Math.floor(Math.random() * Config.molDecayDistance);
            if (offset < 0 || offset > MAX_OFFS || this._vm.world.getOrgIdx(offset) > -1) {
                offset = startOffs + DIR[Math.floor(mol % 8)] * Math.floor(Math.random() * Config.molDecayDistance);
            }
        }

        return offset;
    }
}

module.exports = Decay;