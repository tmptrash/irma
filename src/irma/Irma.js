/**
 * This is application class. Entry point of irma project. Instance of this class
 * should be created in index.html file. Creates main (infinite) loop of application
 * and creates main (manager) object - Virtual Machine (BioVM.js). The only thing you
 * have to do with this class is call run() method to run BioVM and all inner stuff.
 */
const BioVM = require('./BioVM');

class Irma {
    constructor() {
        this._pause = false;
        this._vm    = new BioVM();
        this._runCb = this.run.bind(this);

        this._initLoop();
    }

    run() {
        if (this._pause) {return}
        this._vm.run();
        this.zeroTimeout(this._runCb);
    }

    get pause() {
        return this._pause;
    }

    set pause(val) {
        this._pause = val;
        this.run();
    }

    get ready() {
        return this._vm.ready;
    }

    destroy() {
        this._vm.destroy();
        this._vm       = null;
        this._runCb    = null;
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
            const msgName = 0;

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

module.exports = Irma;