/**
 * Simple implementation of canvas based world, where all organisms leave.
 *
 * @author flatline
 */
const Config   = require('./../Config');
const Canvas   = require('./Canvas');

const ORG_MASK = Config.ORG_MASK;
const ENERGY_COLOR = Config.worldSurfaces[0].color;

class World {
    constructor() {
        this._canvas = new Canvas();
        this._data   = new Uint32Array(Config.WORLD_HEIGHT * Config.WORLD_WIDTH);
    }

    destroy() {
        this._data = null;
        this._canvas.destroy();
        this._canvas = null;
    }

    get data() {
        return this._data;
    }

    dot(offs, c) {
        this._data[offs] = c;
        this._canvas.dot(offs, c);
    }

    swap(offs, offs1) {
        const data = this._data;
        const dot  = data[offs1];

        data[offs1] = data[offs];
        this._canvas.dot(offs1, data[offs]);
        data[offs]  = dot;
        this._canvas.dot(offs, dot);
    }

    energy(offs, index) {
        this._data[offs] = index;
        this._canvas.dot(offs, ENERGY_COLOR);
    }

    empty(offs) {
        this._data[offs] = 0;
        this._canvas.empty(offs);
    }

    org(offs, org) {
        this._data[offs] = ORG_MASK | org.item;
        this._canvas.dot(offs, Config.orgColor);
    }

    moveOrg(org, offs) {
        this._data[org.offs] = 0;
        this._data[offs] = ORG_MASK | org.item;
        this._canvas.move(org.offs, offs, Config.orgColor);
    }

    moveDot(offs, offs1, color) {
        this._data[offs]  = 0;
        this._data[offs1] = color;
        this._canvas.move(offs, offs1, color);
    }

    moveEnergy(offs, offs1, index) {
        this._data[offs]  = 0;
        this._data[offs1] = index;
        this._canvas.move(offs, offs1, ENERGY_COLOR);
    }

    title(text) {
        this._canvas.header(text);
    }
}

module.exports = World;