/**
 * Shows top-left status line and update it every 1000 ms
 * 
 * @author flatline
 */
const Helper = require('./../../common/Helper');
const Config = require('./../../Config');

class Status {
    constructor(vm) {
        this._vm = vm;
        this._ts = Date.now();
        this._i  = 0;

        this._onAfterRunCb = this._onAfterRun.bind(this);
        this._onAfterIterationCb = this._onAfterIteration.bind(this);
        Helper.override(vm, 'afterRun', this._onAfterRunCb);
        Helper.override(vm, 'afterIteration', this._onAfterIterationCb);
    }

    _onAfterRun() {
        const ts = Date.now();
        if (ts - this._ts > 1000) {
            const orgAmount = this._vm.orgs.items;
            if (orgAmount > 0) {
                this._vm.world.title(`inps:${Math.round(((this._i / orgAmount) / (((ts - this._ts) || 1)) * 1000))} orgs:${orgAmount} gen:${this._vm.population}`);
            }
            this._ts = ts;
            this._i = 0;
        }
    }

    _onAfterIteration() {
        this._i += Config.codeLinesPerIteration;
    }
}

module.exports = Status;