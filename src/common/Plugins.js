/**
 * Manages plugins. Loads, removes and runs them.
 * 
 * @author flatline
 */
const Helper = require('./Helper');

class Plugins {
    /**
     * Creates and runs specified plugins and adds handler to parent.destroy()
     * method to remove plugins.
     * @param {Array} plugins Array of plugin classes
     * @param {Object} parent Parent instance for plugins
     */
    constructor(plugins, parent) {
        this._parent      = parent;
        this._onDestroyCb = this._onDestroy.bind(this);

        this.plugins = Helper.loadPlugins(plugins, [parent]);
        Helper.override(parent, 'destroy', this._onDestroyCb);
    }

    /**
     * Destroys plugin array and unoverride handlers
     */
    _onDestroy() {
        Helper.destroyPlugins(this.plugins);
        this.plugins = null;
        Helper.unoverride(this._parent, 'destroy', this._onDestroyCb);
    }
}

module.exports = Plugins;