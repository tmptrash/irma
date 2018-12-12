const FastArray = require('./../common/FastArray');
const Config    = require('./../Config');
const Organism  = require('./Organism');
const World     = require('./World');
const VM        = require('./VM');

class Irma {
    constructor() {
        this.world  = new World();
        this.orgs   = new FastArray(Config.populationSize);
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

    _createOrgs() {
        // const world       = this.world;
        // const positions   = OConfig.orgPosition;
        // const posAmount   = positions.length / 4;
        // const hasPosition = posAmount >= 1;
        //
        // this.reset();
        // for (let i = 0, len = OConfig.orgStartAmount; i < len; i += posAmount) {
        //     if (hasPosition) {
        //         for (let j = 0; j < posAmount; j++) {
        //             const x = Helper.rand(positions[j * 4 + 2]) + positions[j * 4]     - positions[j * 4 + 2] / 2;
        //             const y = Helper.rand(positions[j * 4 + 3]) + positions[j * 4 + 1] - positions[j * 4 + 3] / 2;
        //             if (world.isFree(x, y)) {
        //                 this.createOrg(x, y)
        //             }
        //         }
        //     } else {
        //         this.createOrg(...world.getFreePos());
        //     }
        // }
        // Console.info('Population has created');
    }

    _createOrg(x, y, parent = null) {
        if (x === -1) {return false}
        const orgs = this.orgs;
        const org  = new Organism(++this._orgId + '', x, y, orgs.freeIndex, Config.orgEnergy, Config.orgColor);

        orgs.add(org);
        this.world.dot(x, y, org);

        return org.item;
    }
}

module.exports = Irma;