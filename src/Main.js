/**
 * Entry point of application. Creates Irma instance and all inner stuff.
 *
 * @author flatline
 */
const Bytes2Code = require('./irma/Bytes2Code');
const Config     = require('./Config');
const Irma       = require('./irma/Irma');
//
// Creates global objects to have an access to app from browser's console
//
debugger;
window.irma  = {
    code: Bytes2Code.toCode, // Converter of bytecode to human readable code
    app : new Irma(),        // Instance of Irma. You may use it to access VM, organisms list and so on...
    cfg : Config             // Global configuration. You may change it during app work
};
window.irma.app.ready
    .then(() => irma.app.run())
    .catch(e => console.error(e))