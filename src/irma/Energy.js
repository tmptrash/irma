/**
 * Energy manager
 *
 * @author flatline
 */
const Config   = require('./../Config');
const Organism = require('./Organism');
const Helper   = require('./../common/Helper');

class Energy {
    /**
     * Adds energy to the world according to worldEnergyPercent
     * configuration. Total amount of energy should be less then
     * specified percent.
     * @param {World} world
     */
    static add(world) {
        const width  = Config.WORLD_WIDTH;
        const height = Config.WORLD_HEIGHT;
        const amount = width * height * Config.worldEnergyPercent;
        const color  = Config.energyColor;
        const data   = world.data;
        const rand   = Helper.rand;
        const cur    = this.amount(world);

        for (let i = 0, add = amount - cur; i < add; i++) {
            const x = rand(width);
            const y = rand(height);
            data[x][y] === 0 && world.dot(x, y, color);
        }
    }

    static amount(world) {
        const width  = Config.WORLD_WIDTH;
        const height = Config.WORLD_HEIGHT;
        const data   = world.data;
        let   energy = 0;

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const dot = data[x][y];
                dot !== 0 && dot.constructor !== Organism && energy++;
            }
        }

        return energy;
    }
}

module.exports = Energy;