/**
 * Represents molecules decay process. It tooks one molecule and splits it into two peaces
 * if there is free space near it. One additional dot appears near current after that. If
 * the size of molecule is 1, then it's an atom and decay is impossible.
 * 
 * @author flatline
 */
const Config            = require('./../Config');
const World             = require('./World');
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
     * Array od molecules and arganisms we going to decay by time
     * @param {Object} api
     * @param {World} world
     * @param {FastArray} molsAndOrgs
     */
    constructor(api, world, molsAndOrgs = null) {
        this._molsAndOrgs = molsAndOrgs;
        this._world = world;
        this._api = api;
        this._index = -1;
    }

    destroy() {
        this._molsAndOrgs = null;
        this._world = null;
        this._index = 0;
    }

    setMolsAndOrgs(molsAndOrgs) {
        this._molsAndOrgs = molsAndOrgs;
    }

    decay() {
        const molsAndOrgs = this._molsAndOrgs;
        if (molsAndOrgs.full) {return}
        if (++this._index >= molsAndOrgs.items) {this._index = 0}
        const org = molsAndOrgs.get(this._index);
        if (org.isOrg || org.code.length < 2) {return} // Skip atoms
        const offset = org.offset + DIR[Math.floor(Math.random() * 8)];
        if (offset < 0 || offset > MAX_OFFS) {return}
        const dot = this._world.getOrgIdx(offset);
        if (dot) {return} // organism or molecule on the way
        const newCode = org.code.splice(0, Math.floor(org.code.length / 2));
        this._api.createOrg(offset, org, newCode);
    }
}

module.exports = Decay;