const Config    = require('./Config');
const World     = require('./World');
const FastArray = require('./common/FastArray');
const VM        = require('./VM');

class App {
    constructor() {
        this._world = new World(Config.worldWidth, Config.worldHeight);
        this._orgs  = new FastArray(Config.populationSize);
        this._vm    = new VM(this._world, this._orgs, Config.linesPerIteration);
        this._runCb = this.run.bind(this);

        this._initLoop();
    }

    /**
     * Runs Config.iterationPerRun iterations for all organisms and return
     */
    run() {
        this._vm.run(Config.iterationPerRun);
        this.zeroTimeout(this._runCb);
    }

    destroy() {
        this._vm.destroy();
        this._orgs.destroy();
        this._world.destroy();
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
}

module.exports = App;