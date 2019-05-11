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

    dot(offset, c) {
        this._data[offset] = c;
        this._canvas.dot(offset, c);
    }

    swap(offset, offset1) {
        const data = this._data;
        const dot  = data[offset1];

        data[offset1] = data[offset];
        this._canvas.dot(offset1, data[offset]);
        data[offset]  = dot;
        this._canvas.dot(offset, dot);
    }

    energy(offset, index) {
        this._data[offset] = index;
        this._canvas.dot(offset, ENERGY_COLOR);
    }

    empty(offset) {
        this._data[offset] = 0;
        this._canvas.empty(offset);
    }

    org(offset, org) {
        this._data[offset] = ORG_MASK | org.item;
        this._canvas.dot(offset, Config.orgColor);
    }

    moveOrg(org, offset) {
        this._data[org.offset] = 0;
        this._data[offset] = ORG_MASK | org.item;
        this._canvas.move(org.offset, offset, Config.orgColor);
    }

    moveDot(offset, offset1, color) {
        this._data[offset]  = 0;
        this._data[offset1] = color;
        this._canvas.move(offset, offset1, color);
    }

    moveEnergy(offset, offset1, index) {
        this._data[offset]  = 0;
        this._data[offset1] = index;
        this._canvas.move(offset, offset1, ENERGY_COLOR);
    }

    title(text) {
        this._canvas.header(text);
    }
}

module.exports = World;