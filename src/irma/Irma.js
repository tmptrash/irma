const FastArray = require('./../common/FastArray');
const Helper    = require('./../common/Helper');
const Config    = require('./../Config');
const Organism  = require('./Organism');
const World     = require('./World');
const VM        = require('./VM');

class Irma {
    constructor() {
        this.world  = new World();
        this.orgs   = new FastArray(Config.orgAmount);
        this.vm     = new VM(this.world, this.orgs);
        this._runCb = this.run.bind(this);
        this._orgId = 0;

        this._initLoop();
        this._createOrgs();
    }

    /**
     * Runs Config.iterationsPerRun iterations for all organisms and return
     */
    run() {
        this.vm.run();
        this.zeroTimeout(this._runCb);
    }

    destroy() {
        this.vm.destroy();
        this.orgs.destroy();
        this.world.destroy();
        this._runCb = null;
    }

    /**
     * This hacky function is obtained from here: https://dbaron.org/log/20100309-faster-timeouts
     * It runs a setTimeout() based infinite loop, but faster, then simply using native setTimeout().
     * See this article for details.
     * @return {Boolean} Initialization status. false if function has already exist
     * @hack
     */
    _initLoop() {
        //
        // Only adds zeroTimeout to the Manager object, and hides everything
        // else in a closure.
        //
        (() => {
            let   callback;
            const msgName = 'm';

            window.addEventListener('message', (event) => {
                if (event.data === msgName) {
                    event.stopPropagation();
                    callback();
                }
            }, true);
            //
            // Like setTimeout, but only takes a function argument. There's
            // no time argument (always zero) and no arguments (you have to
            // use a closure)
            //
            this.zeroTimeout = (fn) => {
                callback = fn;
                window.postMessage(msgName, '*');
            };
        })();

        return true;
    }

    /**
     * Creates organisms population according to Config.orgAmount amount.
     * Organisms will be placed randomly in a world
     */
    _createOrgs() {
        const world     = this.world;
        const orgAmount = Config.orgAmount;
        const width     = world.width;
        const height    = world.height;
        const rand      = Helper.rand;

        for (let i = 0; i < orgAmount; i++) {
            const x = rand(width);
            const y = rand(height);
            world.getDot(x, y) === 0 && this._createOrg(x, y);
        }
    }

    /**
     * Creates one organism with default parameters and empty code
     * @param {Number} x X coordinate
     * @param {Number} y Y coordinate
     * @returns {Object} Item in FastArray class
     */
    _createOrg(x, y) {
        const orgs = this.orgs;
        const org  = new Organism(++this._orgId + '', x, y, orgs.freeIndex, Config.orgEnergy, Config.orgColor);

        orgs.add(org);
        this.world.dot(x, y, org);
    }
}

module.exports = Irma;