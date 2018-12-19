/**
 * Entry point of IRMA application. Creates global objects and run them
 *
 * @author flatline
 */
const Irma       = require('./irma/Irma');
const Bytes2Code = require('./irma/Bytes2Code');

window.irma  = {
    code: Bytes2Code.toCode,
    app : new Irma()
};
irma.app.run();