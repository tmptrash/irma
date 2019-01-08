const Bytes2Code = require('./irma/Bytes2Code');
const Config     = require('./Config');
const World      = require('./irma/World');
const VM         = require('./irma/VM');
const Surface    = require('./irma/Surface');
const Energy     = require('./irma/Energy');

class Irma {
    constructor() {
        this._world    = new World();
        this._surfaces = this._createSurfaces();
        this._vm       = new VM(this._world, this._surfaces);
        this._runCb    = this.run.bind(this);

        this._initLoop();
    }

    /**
     * Runs Config.codeTimesPerRun iterations for all organisms and return
     */
    run() {
        this._vm.run();
        this.zeroTimeout(this._runCb);
    }

    destroy() {
        this._vm.destroy();
        this._world.destroy();
        for (let i = 0; i < this._surfaces.length; i++) {this._surfaces[i].destroy()}
        this._surfaces = null;
        this._runCb    = null;
        this._world    = null;
        this._vm       = null;
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

    _createSurfaces() {
        const SURFS  = Config.worldSurfaces;
        const AMOUNT = SURFS.length + 1;

        const surfaces = new Array(AMOUNT);
        surfaces[0] = new Energy(this._world);
        for (let i = 1; i < AMOUNT; i++) {
            surfaces[i] = new Surface(SURFS[i - 1], this._world);
        }

        return surfaces;
    }
}

//
// This is entry point of application. Creates global objects
// to have an access from the console.
//
window.irma  = {
    code: Bytes2Code.toCode,
    app : new Irma(),
    cfg : Config
};
window.irma.app.run();