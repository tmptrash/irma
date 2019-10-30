/**
 * Simple implementation of canvas based world, where all organisms leave.
 * It uses internal Uint32Array instance, where all dots are stored.
 *
 * @author flatline
 */
const Config              = require('./../Config');
const Canvas              = require('./Canvas');

const WORLD_WIDTH         = Config.WORLD_WIDTH;
const WORLD_HEIGHT        = Config.WORLD_HEIGHT;
const WORLD_CANVAS_WIDTH  = Config.WORLD_CANVAS_WIDTH;
const WORLD_CANVAS_HEIGHT = Config.WORLD_CANVAS_HEIGHT;

class World {
    constructor(options) {
        this.viewX     = 0; // X coordinate of canvas
        this.viewY     = 0; // Y coordinate of canvas
        this.viewOffs  = 0; // offset of canvas top left corner
        this.viewOffs1 = 0; // offset of canvas right-bottom corner
        this._data     = new Uint32Array(WORLD_HEIGHT * WORLD_WIDTH);
        this._canvas   = new Canvas(options);
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

    /**
     * Draws a dot in a world always and in a canvas, if it's there. This method
     * is optimized by speed.
     * @param {Number} offset Dot offset 
     * @param {Number} c Dot color 
     */
    dot(offset, c) {
        this._data[offset] = c;

        if (offset < this.viewOffs  || offset > this.viewOffs1) {return}
        const x = offset % WORLD_WIDTH;
        if (x < this.viewX || x >= this.viewX + WORLD_CANVAS_WIDTH) {return}
        this._canvas.dot((offset - this.viewOffs) / WORLD_WIDTH * WORLD_CANVAS_WIDTH + (x - this.viewX), c);
    }

    // TODO:
    swap(offset, offset1) {
        const data = this._data;
        const dot  = data[offset1];

        data[offset1] = data[offset];
        const x = offset1 % WORLD_WIDTH;
        const y = Math.floor(offset1 / WORLD_WIDTH);
        if (x >= this.viewX && x < this.viewX + WORLD_CANVAS_WIDTH &&
            y >= this.viewY && y < this.viewY + WORLD_CANVAS_HEIGHT) {
            this._canvas.dot((y - this.viewY) * WORLD_CANVAS_WIDTH + (x - this.viewX), data[offset]);
        }

        data[offset]  = dot;
        const x1 = offset % WORLD_WIDTH;
        const y1 = Math.floor(offset / WORLD_WIDTH);
        if (x1 >= this.viewX && x1 < this.viewX + WORLD_CANVAS_WIDTH &&
            y1 >= this.viewY && y1 < this.viewY + WORLD_CANVAS_HEIGHT) {
            this._canvas.dot((y1 - this.viewY) * WORLD_CANVAS_WIDTH + (x1 - this.viewX), dot);
        }
    }

    // TODO:
    empty(offset) {
        this._data[offset] = 0;

        const x = offset % WORLD_WIDTH;
        if (x < this.viewX || x >= this.viewX + WORLD_CANVAS_WIDTH) {return}
        const y = Math.floor(offset / WORLD_WIDTH);
        if (y < this.viewY || y >= this.viewY + WORLD_CANVAS_HEIGHT) {return}
        this._canvas.empty((y - this.viewY) * WORLD_CANVAS_WIDTH + (x - this.viewX));
    }

    org(offset, org) {
        this._data[offset] = org.item + 1;

        const x = offset % WORLD_WIDTH;
        if (x < this.viewX || x >= this.viewX + WORLD_CANVAS_WIDTH) {return}
        const y = Math.floor(offset / WORLD_WIDTH);
        if (y < this.viewY || y >= this.viewY + WORLD_CANVAS_HEIGHT) {return}
        this._canvas.dot((y - this.viewY) * WORLD_CANVAS_WIDTH + (x - this.viewX), org.color || Config.molColor);
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

        const x = org.offset % WORLD_WIDTH;
        const y = Math.floor(org.offset / WORLD_WIDTH);
        if (x >= this.viewX && x < this.viewX + WORLD_CANVAS_WIDTH &&
            y >= this.viewY && y < this.viewY + WORLD_CANVAS_HEIGHT) {
            this._canvas.dot((y - this.viewY) * WORLD_CANVAS_WIDTH + (x - this.viewX), 0);
        }
        const x1 = offset % WORLD_WIDTH;
        const y1 = Math.floor(offset / WORLD_WIDTH);
        if (x1 >= this.viewX && x1 < this.viewX + WORLD_CANVAS_WIDTH &&
            y1 >= this.viewY && y1 < this.viewY + WORLD_CANVAS_HEIGHT) {
            this._canvas.dot((y1 - this.viewY) * WORLD_CANVAS_WIDTH + (x1 - this.viewX), org.color);
        }

        org.offset = offset;
    }

    moveDot(offset, offset1, color) {
        this._data[offset]  = 0;
        this._data[offset1] = color;

        const x = offset % WORLD_WIDTH;
        const y = Math.floor(offset / WORLD_WIDTH);
        if (x >= this.viewX && x < this.viewX + WORLD_CANVAS_WIDTH &&
            y >= this.viewY && y < this.viewY + WORLD_CANVAS_HEIGHT) {
            this._canvas.dot((y - this.viewY) * WORLD_CANVAS_WIDTH + (x - this.viewX), 0);
        }
        const x1 = offset1 % WORLD_WIDTH;
        const y1 = Math.floor(offset1 / WORLD_WIDTH);
        if (x1 >= this.viewX && x1 < this.viewX + WORLD_CANVAS_WIDTH &&
            y1 >= this.viewY && y1 < this.viewY + WORLD_CANVAS_HEIGHT) {
            this._canvas.dot((y1 - this.viewY) * WORLD_CANVAS_WIDTH + (x1 - this.viewX), color);
        }
    }

    title(text) {
        this._canvas.header(text);
    }
}

module.exports = World;