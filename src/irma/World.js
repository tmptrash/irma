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

    empty(x, y) {
        this._data[x][y] = 0;
        this._canvas.empty(x, y);
    }

    org(x, y, org) {
        this._data[x][y] = org;
        this._canvas.dot(x, y, org.color);
    }

    move(org, x, y) {
        this._data[org.x][org.y] = 0;
        this._data[x][y] = org;
        this._canvas.move(org.x, org.y, x, y, org.color);
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