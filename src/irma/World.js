/**
 * Simple implementation of canvas based world, where all organisms leave.
 * It uses internal Uint32Array instance, where all dots are stored.
 *
 * @author flatline
 */
const Config = require('./../Config');
const Canvas = require('./Canvas');

class World {
    constructor(options) {
        this.viewX   = 0;
        this.viewY   = 0;
        this._data   = new Uint32Array(Config.WORLD_HEIGHT * Config.WORLD_WIDTH);
        this._canvas = new Canvas(options);
    }

    destroy() {
        this._data = null;
        this._canvas.destroy();
        this._canvas = null;
    }

    get data() {
        return this._data;
    }

    get canvas() {
        return this._canvas;
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

    setItem(offset, item) {
        this._data[offset] = item + 1;
    }

    getOrgIdx(offset) {
        const dot = this._data[offset];
        return !dot ? -1 : dot - 1;
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