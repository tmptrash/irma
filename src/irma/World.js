/**
 * Simple implementation of canvas based world, where all organisms leave.
 *
 * @author flatline
 */
const Config = require('./../Config');
const Canvas = require('./Canvas');

class World {
    constructor() {
        this._canvas = new Canvas();
        this._data   = this._createData();
    }

    destroy() {
        this._data = null;
        this._canvas.destroy();
        this._canvas = null;
    }

    get data() {
        return this._data;
    }

    dot(x, y, c) {
        this._data[x][y] = c;
        this._canvas.dot(x, y, c);
    }

    energy(x, y, index) {
        this._data[x][y] = index;
        this._canvas.dot(x, y, Config.energyColor);
    }

    empty(x, y) {
        this._data[x][y] = 0;
        this._canvas.empty(x, y);
    }

    org(x, y, org) {
        this._data[x][y] = 0x80000000 | org.item;
        this._canvas.dot(x, y, Config.orgColor);
    }

    moveOrg(org, x, y) {
        this._data[org.x << 0][org.y << 0] = 0;
        this._data[x][y] = 0x80000000 | org.item;
        this._canvas.move(org.x << 0, org.y << 0, x, y, Config.orgColor);
    }

    moveDot(x0, y0, x1, y1, color) {
        this._data[x0][y0] = 0;
        this._data[x1][y1] = color;
        this._canvas.move(x0, y0, x1, y1, color);
    }

    moveEnergy(x0, y0, x1, y1, index) {
        this._data[x0][y0] = 0;
        this._data[x1][y1] = index;
        this._canvas.move(x0, y0, x1, y1, Config.energyColor);
    }

    title(text) {
        this._canvas.header(text);
    }
    /**
     * Created world's data. Is a two dimensions array of dots, which
     * contains dots and organisms of the world.
     * @returns {Array} Data array
     * @private
     */
    _createData() {
        const data   = [];
        const HEIGHT = Config.WORLD_HEIGHT;
        const WIDTH  = Config.WORLD_WIDTH;

        for (let x = 0; x < WIDTH; x++) {
            data[x] = (new Array(HEIGHT)).fill(0);
        }

        return data;
    }
}

module.exports = World;