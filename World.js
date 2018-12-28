/**
 * Simple implementation of canvas based world, where all organisms
 * are leaving.
 */
class World {
    constructor(width, height) {
        this.width  = width;
        this.height = height;
        this.data   = [];

        for (let x = 0; x < width; x++) {
            this.data[x] = (new Array(height)).fill(0);
        }
    }

    destroy() {

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