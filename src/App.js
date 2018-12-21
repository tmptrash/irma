/**
 * Entry point of IRMA application. Creates global objects and run them
 *
 * @author flatline
 */
const Irma       = require('./irma/Irma');
const Bytes2Code = require('./irma/Bytes2Code');
const Config     = require('./Config');

window.irma  = {
    code: Bytes2Code.toCode,
    app : new Irma(),
    cfg : Config
};
irma.app.run();