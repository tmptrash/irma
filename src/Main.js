/**
 * Entry point of application. Creates Irma instance, which creates all main
 * app objects and initializes the app. This file should be included to
 *
 * @author flatline
 */
const Bytes2Code = require('./irma/Bytes2Code');
const Config     = require('./Config');
const Irma       = require('./irma/Irma');
//
// Creates global objects to have an access to app from browser's console
//
window.irma  = {
    code: Bytes2Code.toCode,
    app : new Irma(),
    cfg : Config
};
window.irma.app.ready
    .then(() => irma.app.run())
    .catch(e => console.error(e))