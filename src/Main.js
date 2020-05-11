/**
 * Entry point of application. Creates Irma instance and all inner stuff.
 * If you search for documentation see this link for details:
 * https://docs.google.com/document/d/1qTz61YHFw17TLQeiHPI_xKHCWmP0st1fFukv4d9k460
 *
 * @author flatline
 */
const Compiler = require('./irma/Compiler');
const Config   = require('./Config');
const Irma     = require('./irma/Irma');
/**
 * Turns on debug mode, where randomizer uses seed value to
 * produce same values on every app reload
 * @param {Number} seed
 */
function debugMode(seed) {
    let value = seed;

    Math.random = function() {
        value = value * 16807 % 2147483647;
        return value / 2147483647;
    }
}
Config.debugMode && debugMode(Config.debugSeed);
//
// Creates global objects to have an access to app from browser's console
//
window.irma  = {
    code: Compiler.toCode, // Converter of bytecode to human readable code
    app : new Irma(),      // Instance of Irma. You may use it to access VM, organisms list and so on...
    cfg : Config           // Global configuration. You may change it during app work
};
//
// Run irma simulation
//
window.irma.app.run();