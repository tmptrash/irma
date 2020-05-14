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
        // TODO: these properties should be private
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
     * Draws organism as a dot in specified offset in a world map. It it's inside canvas, 
     * then draws it there also. This method is optimized for speed.
     * @param {Number} offset New organism offset
     * @param {Organism} org Organism instance
     */
    org(offset, org) {
        this._data[offset] = org.molIndex + 1;

        if (offset < this.viewOffs || offset > this.viewOffs1) {return}
        const x = offset % WORLD_WIDTH;
        if (x < this.viewX || x > this.viewX1) {return}
        this._canvas.dot(Math.floor((offset - this.viewOffs) / WORLD_WIDTH) * WORLD_CANVAS_WIDTH + (x - this.viewX), org.color);
    }

    /**
     * Draws olecule as a dot in specified offset in a world map. It it's inside canvas, 
     * then draws it there also. This method is optimized for speed.
     * @param {Number} offset New molecule offset
     * @param {Molecule} mol Molecule instance
     * @param {Number} color Molecule color
     */
    mol(offset, mol, color) {
        this._data[offset] = mol.index + 1;

        if (offset < this.viewOffs || offset > this.viewOffs1) {return}
        const x = offset % WORLD_WIDTH;
        if (x < this.viewX || x > this.viewX1) {return}
        this._canvas.dot(Math.floor((offset - this.viewOffs) / WORLD_WIDTH) * WORLD_CANVAS_WIDTH + (x - this.viewX), color);
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

    setItem(offset, index) {
        this._data[offset] = index + 1;
    }

    /**
     * Returns organism or molecule index in FastArray list
     * @param {Number} offset Offset to check
     * @return {Number} -1 if at specified offset there is no organism or molecule, 0...xx - org|molecule index
     */
    index(offset) {
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
        this._data[offset] = org.molIndex + 1;

        let x;
        if (org.offset >= this.viewOffs && org.offset <= this.viewOffs1 && (x = org.offset % WORLD_WIDTH) >= this.viewX && x <= this.viewX1) {
            this._canvas.dot(Math.floor((org.offset - this.viewOffs) / WORLD_WIDTH) * WORLD_CANVAS_WIDTH + (x - this.viewX), 0);
        }
        if (offset >= this.viewOffs && offset <= this.viewOffs1 && (x = offset % WORLD_WIDTH) >= this.viewX && x <= this.viewX1) {
            this._canvas.dot(Math.floor((offset - this.viewOffs) / WORLD_WIDTH) * WORLD_CANVAS_WIDTH + (x - this.viewX), org.color);
        }

        org.offset = offset;
    }

    title(text) {
        this._canvas.header(text);
    }
}

module.exports = World;