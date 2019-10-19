/**
 * Represents molecules decay process. It tooks one molecule and splits it into two,
 * if there is free space near it. One additional dot appears near current after that. If
 * the size of molecule is bigger or equal than molCodeSize, then it's an atom and decay 
 * is impossible.
 *  
 * @plugin
 * @author flatline
 */
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
        this._orgsAndMols = vm.orgsAndMols;
        this._world = vm.world;
        this._api = vm.api;
        this._index = -1;
    }

    destroy() {
        this._orgsAndMols = null;
        this._world = null;
        this._index = 0;
    }

    run(iteration) {
        if (iteration % Config.molDecayPeriod !== 0) {return}

        const orgsAndMols = this._orgsAndMols;
        if (orgsAndMols.full) {return}
        if (++this._index >= orgsAndMols.items) {this._index = 0}
        const org = orgsAndMols.get(this._index);
        if (org.isOrg || org.code.length <= Config.molCodeSize) {return} // Skip atoms
        const offset = org.offset + DIR[Math.floor(Math.random() * 8)];
        if (offset < 0 || offset > MAX_OFFS) {return}
        const dot = this._world.getOrgIdx(offset);
        if (dot > -1) {return} // organism or molecule on the way
        //
        // This line moves index back to current item to decay it till the end.
        // It's good for big (with long code) molecules
        //
        this._index--;
        const newCode = org.code.splice(0, Math.floor(org.code.length / 2));
        this._api.createOrg(offset, org, newCode);
    }
}

module.exports = Decay;