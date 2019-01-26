/**
 * Class, which creates and moves dots of specified surface (e.g.: lava, water, sand,...)
 * in time. It moves all dots in special random chosen direction. This is analog of earth
 * planes moving or water move.
 *
 * @author flatline
 */
const Helper  = require('./../common/Helper');
const Config  = require('./../Config');
/**
 * {Array} Array of increments. Using it we may obtain coordinates of the
 * point depending on one of 8 directions. We use these values in any command
 * related to sight, moving and so on
 */
const DIRX    = Config.DIRX;
const DIRY    = Config.DIRY;

const WIDTH   = Config.WORLD_WIDTH  - 1;
const HEIGHT  = Config.WORLD_HEIGHT - 1;

const rand    = Helper.rand;

class Surface {
    constructor(cfg, world) {
        this.world       = world;
        this.data        = world.data;

        this.color       = cfg.color;
        this.energy      = cfg.energy;
        this.step        = cfg.step;
        this.amount      = cfg.amount * 2;
        this.block       = cfg.block;
        this.dots        = new Array(this.amount);

        this.dirx        = Helper.rand(Config.WORLD_WIDTH);
        this.diry        = Helper.rand(Config.WORLD_HEIGHT);
        this.i           = 0;
        this.blocked     = 0;
        this._blockLimit = (cfg.amount * cfg.block) << 0;

        this.initDots();
    }

    destroy() {
        this.world  = null;
        this.dots   = [];
        this.data   = null;
    }

    move() {
        if (this.i >= this.amount) {this.i = this.blocked = 0}
        const dots = this.dots;
        const x0   = dots[this.i++];
        const y0   = dots[this.i++];
        if (x0 < 0) {return}
        if (this.notSurfaceDot(x0, y0)) {++this.blocked; return}
        const x1   = x0 + (this.dirx > x0 ? 1 : -1);
        const y1   = y0 + (this.diry > y0 ? 1 : -1);

        if (x1 < 0 || x1 > WIDTH || y1 < 0 || y1 > HEIGHT || this.data[x1][y1] !== 0) {
            if (rand(10) < 9) {
                const intd = rand(8);
                const x2 = x0 + DIRX[intd];
                const y2 = y0 + DIRY[intd];
                if (x2 >= 0 && x2 <= WIDTH && y2 >= 0 && y2 <= HEIGHT && this.data[x2][y2] === 0) {
                    this.onMove(x0, y0, x2, y2, this.color);
                    dots[this.i - 2] = x2;
                    dots[this.i - 1] = y2;
                } else if (++this.blocked > this._blockLimit) {
                    this.dirx    = rand(Config.WORLD_WIDTH);
                    this.diry    = rand(Config.WORLD_HEIGHT);
                    this.blocked = 0;
                }
            } else if (++this.blocked > this._blockLimit) {
                this.dirx    = rand(Config.WORLD_WIDTH);
                this.diry    = rand(Config.WORLD_HEIGHT);
                this.blocked = 0;
            }
            return;
        }

        this.onMove(x0, y0, x1, y1, this.color);
        dots[this.i - 2] = x1;
        dots[this.i - 1] = y1;
    }

    /**
     * Checks if specified dot is a dot of current surface. The dot may be grabbed by
     * the organism, so we can't move it at this moment
     * @param {Number} x dot X
     * @param {Number} y dot Y
     * @returns {Boolean}
     */
    notSurfaceDot(x, y) {
        return this.world.data[x][y] !== this.color;
    }

    onMove(x0, y0, x1, y1, color) {
        this.world.moveDot(x0, y0, x1, y1, color);
    }

    dot(x, y, color) {
        this.world.dot(x, y, color);
    }

    /**
     * This method should draw all energy dots according to this.amount
     * without spaces. this.dots array should be filled.
     */
    initDots() {
        const width  = Config.WORLD_WIDTH;
        const height = Config.WORLD_HEIGHT;
        const color  = this.color;
        const data   = this.world.data;
        const dots   = this.dots;
        const rand   = Helper.rand;
        let   amount = this.amount - 1;

        if ((this.amount >> 1) > width * height) {
            throw new Error('Amount of dots of surface is bigger then world size');
        }
        while (amount > 0) {
            const x = rand(width);
            const y = rand(height);
            if (data[x][y] === 0) {
                dots[amount--] = y;
                dots[amount--] = x;
                this.dot(x, y, color);
            }
        }
    }
}

module.exports = Surface;