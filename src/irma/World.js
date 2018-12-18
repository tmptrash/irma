/**
 * Simple implementation of canvas based world, where all organisms leave.
 *
 * @author flatline
 */
const Config = require('./../Config');
const Canvas = require('./Canvas');

class World {
    constructor() {
        this.width  = Config.worldWidth;
        this.height = Config.worldHeight;
        this.data   = [];
        this.canvas = new Canvas(this.width, this.height);

        for (let x = 0; x < this.width; x++) {
            this.data[x] = (new Array(this.height)).fill(0);
        }
    }

    destroy() {
        this.data = null;
        this.canvas.destroy();
        this.canvas = null;
    }

    dot(x, y, c) {
        this.data[x][y] = c;
        this.canvas.dot(x, y, c.color);
    }

    move(x0, y0, x1, y1, color) {
        this.data[x0][y0] = 0;
        this.data[x1][y1] = color;
        this.canvas.move(x0, y0, x1, y1, color);
    }

    getDot(x, y) {
        return this.data[x][y];
    }

    outOf(x, y) {
        return x < 0 || x >= this.width || y < 0 || y >= this.height;
    }

    speed(text) {
        this.canvas.header(text);
    }
}

module.exports = World;