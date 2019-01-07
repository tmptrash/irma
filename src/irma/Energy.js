/**
 * Energy manager. Extends Surface and ability to move energy in some
 * direction. It also tracks amount of energy and add it to the world.
 *
 * @author flatline
 */
const Config     = require('./../Config');
const Surface    = require('./Surface');
const Helper     = require('./../common/Helper');

const REMOVED    = -2;
const MAX_ENERGY = (Config.orgCloneEnergy - 1) * Config.orgAmount;

const WIDTH      = Config.WORLD_WIDTH;
const HEIGHT     = Config.WORLD_HEIGHT;

const rand       = Helper.rand;

class Energy extends Surface {
    constructor(world) {
        super({
            color : Config.energyColor,
            energy: 0,
            step  : 1,
            amount: Config.energyAmount}, world
        );

        this._indexes = new Array(this.amount >> 1);
        this._index   = -1;
    }

    clear(index) {
        this._indexes[++this._index] = index;
        this.dots[index]             = REMOVED;
    }

    dot(x, y, color) {
        const index = this._indexes[this._index--];
        this.dots[index]     = x;
        this.dots[index + 1] = y;
        this.world.energy(x, y, 0x40000000 | index);
        super.dot(x, y, color);
    }

    onDot(x, y, color, i) {
        this.world.energy(x, y, 0x40000000 | i);
    }

    move(orgsEnergy) {
        if (orgsEnergy + (this.amount >> 1) * Config.energyValue < MAX_ENERGY && this._index >= 0) {
            const x = rand(WIDTH);
            const y = rand(HEIGHT);
            this.data[x][y] === 0 && this.dot(x, y, this.color);
        }
        super.move();
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
        this.world.moveEnergy(x0, y0, x1, y1, 0x40000000 | (this._i - 2));
    }

    // /**
    //  * Adds energy to the world according to worldEnergyPercent
    //  * configuration. Total amount of energy should be less then
    //  * specified percent.
    //  * @param {World} world
    //  */
    // static add(world) {
    //     const width  = Config.WORLD_WIDTH;
    //     const height = Config.WORLD_HEIGHT;
    //     const amount = width * height * Config.worldEnergyPercent;
    //     const color  = Config.energyColor;
    //     const data   = world.data;
    //     const rand   = Helper.rand;
    //     const cur    = this.amount(world);
    //
    //     for (let i = 0, add = amount - cur; i < add; i++) {
    //         const x = rand(width);
    //         const y = rand(height);
    //         data[x][y] === 0 && world.dot(x, y, color);
    //     }
    // }
    //
    // static amount(world) {
    //     const width  = Config.WORLD_WIDTH;
    //     const height = Config.WORLD_HEIGHT;
    //     const data   = world.data;
    //     let   energy = 0;
    //
    //     for (let x = 0; x < width; x++) {
    //         for (let y = 0; y < height; y++) {
    //             const dot = data[x][y];
    //             dot !== 0 && dot.constructor !== Organism && energy++;
    //         }
    //     }
    //
    //     return energy;
    // }
}

module.exports = Energy;