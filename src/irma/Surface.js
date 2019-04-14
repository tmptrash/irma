/**
 * Class, which creates and moves dots of specified surface (e.g.: lava, water, sand,...)
 * in time. It moves all dots in special random chosen directions. This is analog of earth
 * planes moving or water tides.
 *
 * @author flatline
 */
const Helper   = require('./../common/Helper');
const Config   = require('./../Config');
/**
 * {Array} Array of increments. Using it we may obtain coordinates of the
 * point depending on one of 8 directions. We use these values in any command
 * related to sight, moving and so on
 */
const WIDTH1     = Config.WORLD_WIDTH;
const HEIGHT1    = Config.WORLD_HEIGHT;
const ORG_MASK   = Config.ORG_MASK;
const rand       = Helper.rand;
const abs        = Math.abs;
const INDEX_MASK = 0x0000000f;

class Surface {
    constructor(cfg, index, world) {
        this._applyCfg(cfg);

        this._index      = index;
        this._world      = world;
        this._data       = world.data;
        this._dirx       = null;
        this._diry       = null;
        this._curAmount  = 0;
        this._i          = 0;
        this.curDelay    = 0;

        this._initDirs();
        this._initDots();
    }

    destroy() {
        this._world = null;
        this._data  = null;
    }

    move() {
        const SCAN  = this.scan;
        const DATA  = this._data;
        const DIRX  = this._dirx;
        const DIRY  = this._diry;
        const SURF_INDEX = this._index;

        for (let i = 0; i < SCAN; i++) {
            const x   = rand(WIDTH1);
            const y   = rand(HEIGHT1);
            const dot = DATA[x][y];
            if (dot !== 0 && (dot & ORG_MASK) === 0 && (dot & INDEX_MASK) === SURF_INDEX) {
                const INDEX = this._findDirIndex(x, y);
                //
                // Changes direction randomly, but most of the time go to the right direction
                //
                const x1 = x + (DIRX[INDEX] > x && rand(3) > 0 ? 1 : -1);
                const y1 = y + (DIRY[INDEX] > y && rand(3) > 0 ? 1 : -1);

                if (x1 >= 0 && x1 < WIDTH1 && y1 >= 0 && y1 < HEIGHT1) {
                    const destDot = DATA[x1][y1];
                    if (destDot === 0) {
                        this._world.moveDot(x, y, x1, y1, dot);
                    } else if ((destDot & ORG_MASK) === 0) {
                        this._world.swap(x, y, x1, y1);
                    }
                }
            }
        }

        if ((this._i += SCAN) > this.dirUpdate) {
            this._i = 0;
            this._initDirs();
        }
    }

    get curAmount() {
        return this._curAmount;
    }

    remove(x, y, hide = false) {
        this._world.empty(x, y);
        !hide && this._curAmount--;
    }

    put(dot = this.color, isNew = true) {
        // TODO: refactor this while()
        while (true) {
            const x = rand(WIDTH1);
            const y = rand(HEIGHT1);
            if (this._data[x][y] === 0) {
                this._world.dot(x, y, dot);
                isNew && this._curAmount++;
                break;
            }
        }
    }

    _applyCfg(cfg) {
        for (let prop in cfg) {
            if (cfg.hasOwnProperty(prop)) {
                this[prop] = cfg[prop];
            }
        }
    }

    /**
     * This method should draw all energy dots according to this.amount
     * without spaces. this.dots array should be filled.
     */
    _initDots() {
        const color  = this.color;
        const world  = this._world;
        const data   = this._data;
        let   amount = this.amount - 1;

        if (this.amount > WIDTH1 * HEIGHT1) {
            throw new Error('Amount of dots of surface is bigger then world size');
        }
        while (amount > 0) {
            const x = rand(WIDTH1);
            const y = rand(HEIGHT1);
            if (data[x][y] === 0) {
                world.dot(x, y, color);
                amount--;
            }
        }
        this._curAmount = this.amount - 1;
    }

    _initDirs() {
        const DIR_AMOUNT = this.dirs;
        this._dirx       = new Array(DIR_AMOUNT);
        this._diry       = new Array(DIR_AMOUNT);

        for (let i = 0; i < DIR_AMOUNT; i++) {
            this._dirx[i] = rand(WIDTH1);
            this._diry[i] = rand(HEIGHT1);
        }
    }

    /**
     * Returns random direction index in arrays this._dirx, this._diry
     * @param {Number} x X coordinate we need to find
     * @param {Number} y Y coordinate we need to find
     * @returns {Number} Index of left value. +1 will take us right value
     * @private
     */
    _findDirIndex(x, y) {
        const DIRX     = this._dirx;
        const DIRY     = this._diry;
        let   index    = 0;
        let   distance = Infinity;

        for (let i = 0, l = DIRX.length; i < l; i++) {
            const curDistance = abs(DIRX[i] - x) + abs(DIRY[i] - y);
            if (curDistance < distance) {
                index = i;
                distance = curDistance;
            }
        }

        return index;
    }
}

module.exports = Surface;