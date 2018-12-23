const Bytes2Code = require('./irma/Bytes2Code');
const Config     = require('./Config');
const World      = require('./irma/World');
const VM         = require('./irma/VM');

class Irma {
    constructor() {
        this._world  = new World();
        this.vm     = new VM(this._world);
        this._runCb = this.run.bind(this);

        this._initLoop();
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
        this._world.destroy();
        this._runCb = null;
        this._world  = null;
        this.vm     = null;
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