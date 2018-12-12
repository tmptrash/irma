/**
 * Simple implementation of canvas based world, where all organisms leave.
 */
class World {
    constructor() {
        this.width  = Config.worldWidth;
        this.height = Config.worldHeight;
        this.data   = [];

        for (let x = 0; x < this.width; x++) {
            this.data[x] = (new Array(this.height)).fill(0);
        }
    }

    destroy() {
        this.data = null;
    }

    dot(x, y, c) {
        this.data[x][y] = c;
    }

    getDot(x, y) {
        return this.data[x][y];
    }

    outOf(x, y) {
        return x < 0 || x >= this.width || y < 0 || y >= this.height;
    }
}

module.exports = World;