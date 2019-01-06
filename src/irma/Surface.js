/**
 * Class, which creates and moves dots of specified surface (e.g.: lava, water, send,...)
 * in time. It moves all dots in special random chosen direction. This is analog of earth
 * planes moving or water move.
 *
 * @author flatline
 */
const Helper  = require('./../common/Helper');
const Config  = require('./../Config');

const WIDTH       = Config.WORLD_WIDTH  - 1;
const HEIGHT      = Config.WORLD_HEIGHT - 1;
/**
 * {Array} Array of increments. Using it we may obtain coordinates of the
 * point depending on one of 8 directions. We use these values in any command
 * related to sight, moving and so on
 */
const DIRX    = [0,   1, 1, 1, 0, -1, -1, -1];
const DIRY    = [-1, -1, 0, 1, 1,  1,  0, -1];

const rand    = Helper.rand;

class Surface {
    constructor(cfg, world) {
        this.world       = world;
        this.data        = world.data;

        this.color       = cfg.color;
        this.energy      = cfg.energy;
        this.step        = cfg.step;
        this.amount      = cfg.amount * 2;
        this.dots        = new Array(this.amount);

        this._dirx       = Helper.rand(Config.WORLD_WIDTH);
        this._diry       = Helper.rand(Config.WORLD_HEIGHT);
        this._i          = 0;
        this._blocked    = 0;
        this._blockLimit = cfg.amount / 2 << 0;

        this._initDots();
    }

    destroy() {
        this.world  = null;
        this.dots   = [];
        this.data   = null;
    }

    move() {
        if (this._i >= this.amount) {this._i = this._blocked = 0}
        const dots = this.dots;
        const x0   = dots[this._i];
        const y0   = dots[this._i+1];
        let   x1   = x0 + (this._dirx > x0 ? 1 : -1);
        let   y1   = y0 + (this._diry > y0 ? 1 : -1);
        this._i   += 2;

        if (x1 < 0 || x1 > WIDTH || y1 < 0 || y1 > HEIGHT) {return}     // out of the world
        if (this.data[x1][y1] !== 0 || rand(2) === 0) {                 // something on a way
            const intd = rand(8);
            x1 = x0 + DIRX[intd];
            y1 = y0 + DIRY[intd];
            if (x1 < 0 || x1 > WIDTH || y1 < 0 || y1 > HEIGHT || this.data[x1][y1] !== 0) {
                if (++this._blocked > this._blockLimit) {
                    this._dirx = rand(Config.WORLD_WIDTH);
                    this._diry = rand(Config.WORLD_HEIGHT);
                }
                return;
            }
        }

        this.onMove(x0, y0, x1, y1, this.color);
        dots[this._i - 2] = x1;
        dots[this._i - 1] = y1;
    }

    onMove(x0, y0, x1, y1, color) {
        this.world.moveDot(x0, y0, x1, y1, color);
    }

    dot(x, y, color) {
        this.world.dot(x, y, color);
    }

    onDot(x, y, color) {
        this.dot(x, y, color);
    }

    /**
     * This method should draw all energy dots according to this.amount
     * without spaces. this.dots array should be filled.
     * @private
     */
    _initDots() {
        const width  = Config.WORLD_WIDTH;
        const height = Config.WORLD_HEIGHT;
        const amount = this.amount;
        const color  = this.color;
        const data   = this.world.data;
        const dots   = this.dots;
        const rand   = Helper.rand;

        if (amount >> 1 > width * height) {
            throw new Error('Amount of dots of surface is bigger then world size');
        }
        let i = 0;
        while (i < amount) {
            const x = rand(width);
            const y = rand(height);
            if (data[x][y] === 0) {
                this.onDot(x, y, color, i);
                dots[i++] = x;
                dots[i++] = y;
            }
        }
    }
}

module.exports = Surface;