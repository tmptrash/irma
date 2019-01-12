/**
 * This is application class. Entry point of irma project. Instance of this class
 * should be created in index.html file. Creates main (infinite) loop of application
 * and creates main (manager) object - Virtual Machine (VM.js). The only thing you
 * have to do with this class is call run() method to run VM and all inner stuff.
 */
const Bytes2Code = require('./irma/Bytes2Code');
const Config     = require('./Config');
const VM         = require('./irma/VM');

class Irma {
    constructor() {
        this._vm    = new VM();
        this._runCb = this.run.bind(this);

        this._initLoop();
    }

    run() {
        this._vm.run();
        this.zeroTimeout(this._runCb);
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
// Creates global objects to have an access to app from browser's console
//
window.irma  = {
    code: Bytes2Code.toCode,
    app : new Irma(),
    cfg : Config
};