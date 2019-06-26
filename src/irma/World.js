/**
 * Simple implementation of canvas based world, where all organisms leave.
 *
 * @author flatline
 */
const Config   = require('./../Config');
const Canvas   = require('./Canvas');

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

    empty(offset) {
        this._data[offset] = 0;
        this._canvas.empty(offset);
    }

    org(offset, org) {
        this._data[offset] = org.item + 1;
        this._canvas.dot(offset, org.color);
    }

    getOrgIdx(offset) {
        const dot = this._data[offset];
        return !dot ? 0 : dot - 1;
    }

    moveOrg(org, offset) {
        this._data[org.offset] = 0;
        this._data[offset] = org.item + 1;
        this._canvas.move(org.offset, offset, org.color);
        org.offset = offset;
    }

    moveDot(offset, offset1, color) {
        this._data[offset]  = 0;
        this._data[offset1] = color;
        this._canvas.move(offset, offset1, color);
    }

    title(text) {
        this._canvas.header(text);
    }
}

module.exports = World;