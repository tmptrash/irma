/**
 * Energy manager. Extends Surface and ability to move energy in some
 * direction. It also tracks amount of energy and add it to the world.
 *
 * @author flatline
 */
const Config        = require('./../Config');
const Surface       = require('./Surface');
const Helper        = require('./../common/Helper');

const REMOVED       = -2;
const NEW_DIR_AFTER = 10000000;
/**
 * {Number} This value very important. This is amount of total energy in a world
 * (organisms + energy). This value organisms must not exceed. This is how we
 * create a lack of resources in a world.
 */
const MAX_ENERGY  = (Config.orgCloneEnergy >> 1) * Config.orgAmount;
const ENERGY_MASK = Config.ENERGY_MASK;

const WIDTH       = Config.WORLD_WIDTH;
const HEIGHT      = Config.WORLD_HEIGHT;

const rand        = Helper.rand;

class Energy extends Surface {
    constructor(world) {
        super({
            color    : Config.energyColor,
            energy   : 0,
            step     : 1,
            radiation: 0,
            barrier  : false,
            delay    : 50,
            amount   : Config.energyAmount,
            block    : Config.energyBlockPercent}, world
        );
        this._dirIndex = 0;
    }

    initDots() {
        this._indexes = new Array(this.amount >> 1);
        const indexes = this._indexes;
        for (let i = 0, j = 0, len = this.amount; i < len; i += 2) {indexes[j++] = i}
        this._index   = (this.amount >> 1) - 1;
        super.initDots();
    }

    clear(index) {
        this._indexes[++this._index] = index;
        this.dots[index]             = REMOVED;
    }

    dot(x, y, color) {
        const index = this._indexes[this._index--];
        this.dots[index]     = x;
        this.dots[index + 1] = y;
        this.world.energy(x, y, ENERGY_MASK | index);
    }

    /**
     * Checks if specified dot is a dot of Energy surface. The dot may be grabbed by
     * the organism, so we can't move it at this moment
     * @param {Number} x dot X
     * @param {Number} y dot Y
     * @returns {Boolean}
     */
    notSurfaceDot(x, y) {
        return (this.world.data[x][y] & ENERGY_MASK) === 0;
    }

    update(orgsEnergy) {
        if (orgsEnergy + ((this.amount >> 1) - (this._index + 1)) * Config.energyValue < MAX_ENERGY && this._index >= 0) {
            const x = rand(WIDTH);
            const y = rand(HEIGHT);
            this.data[x][y] === 0 && this.dot(x, y, this.color);
        }
    }

    /**
     * This override doesn't call super.onMove() method, because this class
     * moves energy instead of some kind of surfaces
     * @param {Number} x0 Beginning X coordinate of energy
     * @param {Number} y0 Beginning Y coordinate of energy
     * @param {Number} x1 Final X coordinate of energy
     * @param {Number} y1 Final Y coordinate of energy
     */
    onMove(x0, y0, x1, y1) {
        this.world.moveEnergy(x0, y0, x1, y1, ENERGY_MASK | (this.i - 2));
        if (++this._dirIndex > NEW_DIR_AFTER) {
            this.dirx      = rand(Config.WORLD_WIDTH);
            this.diry      = rand(Config.WORLD_HEIGHT);
            this._dirIndex = 0;
            this.blocked   = 0;
        }
    }
}

module.exports = Energy;