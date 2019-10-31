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
        this.viewX     = 0;                        // X coordinate of canvas
        this.viewX1    = WORLD_CANVAS_WIDTH - 1;   // X1 coordinate of canvas (right X)
        this.viewY     = 0;                        // Y coordinate of canvas
        this.viewOffs  = 0;                        // offset of canvas top left corner
        this.viewOffs1 = (WORLD_CANVAS_HEIGHT - 1) * WORLD_WIDTH + WORLD_CANVAS_WIDTH - 1; // offset of canvas right-bottom corner
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
     * Draws a dot in a world and if it's within canvas draws it there. This method
     * is optimized by speed.
     * @param {Number} offset Dot offset 
     * @param {Number} c Dot color
     */
    dot(offset, c) {
        this._data[offset] = c;

        if (offset < this.viewOffs || offset > this.viewOffs1) {return}
        const x = offset % WORLD_WIDTH;
        if (x < this.viewX || x > this.viewX1) {return}
        this._canvas.dot(Math.floor((offset - this.viewOffs) / WORLD_WIDTH) * WORLD_CANVAS_WIDTH + (x - this.viewX), c);
    }

    /**
     * Swaps two dots by offset. Swaps two dots in a world map and do it in a canvas if 
     * dots are there. If only one dot is inside the canvas then draws only one. This method
     * is optimized for speed.
     * @param {Number} offset Source offset
     * @param {Number} offset1 Destination offset
     */
    swap(offset, offset1) {
        const data = this._data;
        const dot  = data[offset1];

        data[offset1] = data[offset];
        let x;
        if (offset1 >= this.viewOffs && offset1 <= this.viewOffs1 && (x = offset1 % WORLD_WIDTH) >= this.viewX && x <= this.viewX1) {
            this._canvas.dot(Math.floor((offset1 - this.viewOffs) / WORLD_WIDTH) * WORLD_CANVAS_WIDTH + (x - this.viewX), data[offset]);
        }

        data[offset]  = dot;
        if (offset >= this.viewOffs && offset <= this.viewOffs1 && (x = offset % WORLD_WIDTH) >= this.viewX && x <= this.viewX1) {
            this._canvas.dot(Math.floor((offset - this.viewOffs) / WORLD_WIDTH) * WORLD_CANVAS_WIDTH + (x - this.viewX), dot);
        }
    }

    /**
     * Set dot color to 0x000000 (empty). Sets colot for world's map and if it's within canvas,
     * then sets it there also. This method is optimized for speed.
     * @param {Number} offset Dot offset
     */
    empty(offset) {
        this._data[offset] = 0;

        if (offset < this.viewOffs || offset > this.viewOffs1) {return}
        const x = offset % WORLD_WIDTH;
        if (x < this.viewX || x > this.viewX1) {return}
        this._canvas.empty(Math.floor((offset - this.viewOffs) / WORLD_WIDTH) * WORLD_CANVAS_WIDTH + (x - this.viewX));
    }

    /**
     * Draws organism as a dot in specified offset in a world map. It it's inside canvas, 
     * then draws it there also. This method is optimized for speed.
     * @param {Number} offset New organism offset
     * @param {Organism} org Organism instance
     */
    org(offset, org) {
        this._data[offset] = org.item + 1;

        if (offset < this.viewOffs || offset > this.viewOffs1) {return}
        const x = offset % WORLD_WIDTH;
        if (x < this.viewX || x > this.viewX1) {return}
        this._canvas.dot(Math.floor((offset - this.viewOffs) / WORLD_WIDTH) * WORLD_CANVAS_WIDTH + (x - this.viewX), org.color || Config.molColor);
    }

    setItem(offset, item) {
        this._data[offset] = item + 1;
    }

    /**
     * Returns organism index in organisms and molecules FastArray list
     * @param {Number} offset Offset to check
     * @return {Number} -1 if at specified offset there is no organism or molecule, 0...xx - org|molecule index
     */
    getOrgIdx(offset) {
        const dot = this._data[offset];
        return !dot ? -1 : dot - 1;
    }

    /**
     * Moves organism dot from current position to new by offset. This method is optimized by speed.
     * @param {Organism} org Organism instance
     * @param {Number} offset New offset
     */
    moveOrg(org, offset) {
        this._data[org.offset] = 0;
        this._data[offset] = org.item + 1;

        let x;
        if (org.offset >= this.viewOffs && org.offset <= this.viewOffs1 && (x = org.offset % WORLD_WIDTH) >= this.viewX && x <= this.viewX1) {
            this._canvas.dot(Math.floor((org.offset - this.viewOffs) / WORLD_WIDTH) * WORLD_CANVAS_WIDTH + (x - this.viewX), 0);
        }
        if (offset >= this.viewOffs && offset <= this.viewOffs1 && (x = offset % WORLD_WIDTH) >= this.viewX && x <= this.viewX1) {
            this._canvas.dot(Math.floor((offset - this.viewOffs) / WORLD_WIDTH) * WORLD_CANVAS_WIDTH + (x - this.viewX), org.color);
        }

        org.offset = offset;
    }

    /**
     * The same like moveOrg(), but moves a dot. Optimized by speed.
     * @param {Number} offset Source dot offset
     * @param {Number} offset1 Destination dot offset
     * @param {Number} color Destination dot color
     */
    moveDot(offset, offset1, color) {
        this._data[offset]  = 0;
        this._data[offset1] = color;

        let x;
        if (offset >= this.viewOffs && offset <= this.viewOffs1 && (x = offset % WORLD_WIDTH) >= this.viewX && x <= this.viewX1) {
            this._canvas.dot(Math.floor((offset - this.viewOffs) / WORLD_WIDTH) * WORLD_CANVAS_WIDTH + (x - this.viewX), 0);
        }

        if (offset1 >= this.viewOffs && offset1 <= this.viewOffs1 && (x = offset1 % WORLD_WIDTH) >= this.viewX && x <= this.viewX1) {
            this._canvas.dot(Math.floor((offset1 - this.viewOffs) / WORLD_WIDTH) * WORLD_CANVAS_WIDTH + (x - this.viewX), color);
        }
    }

    title(text) {
        this._canvas.header(text);
    }
}

module.exports = World;