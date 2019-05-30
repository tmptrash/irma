/**
 * Class, which creates elements of the world. Element is an instruction (command)
 * of our VM. These commands are food for organisms and at the same time their
 * bodies building blocks
 *
 * @author flatline
 */
const Helper     = require('./../common/Helper');
const Config     = require('./../Config');
const Mutations  = require('./Mutations');
const WIDTH1     = Config.WORLD_WIDTH;
const HEIGHT1    = Config.WORLD_HEIGHT;
const MAX_OFFS   = WIDTH1 * HEIGHT1 - 1;
const rand       = Helper.rand;

class Elements {
    constructor(world) {
        this._world      = world;
        this._data       = world.data;
        this._curAmount  = 0;

        this._init();
    }

    destroy() {
        this._world = null;
        this._data  = null;
    }

    get curAmount() {
        return this._curAmount;
    }

    remove(offs, hide = false) {
        this._world.empty(offs);
        !hide && this._curAmount--;
    }

    add() {
        const offs = rand(MAX_OFFS);
        if (this._data[offs] === 0) {
            this._world.dot(offs, Mutations.randCmd());
            this._curAmount++;
        }
    }

    /**
     * This method should draw all energy dots according to this.amount
     * without spaces. this.dots array should be filled.
     */
    _init() {
        const color  = this.color;
        const world  = this._world;
        const data   = this._data;
        let   amount = this.amount - 1;

        if (this.amount > WIDTH1 * HEIGHT1) {
            throw new Error('Amount of dots of surface is bigger then world size');
        }
        while (amount > 0) {
            const offs = rand(MAX_OFFS);
            if (data[offs] === 0) {
                world.dot(offs, color);
                amount--;
            }
        }
        this._curAmount = this.amount - 1;
    }
}

module.exports = Elements;