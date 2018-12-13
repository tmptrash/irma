/**
 * Entry point of IRMA application. Creates global objects and run them
 *
 * @author flatline
 */
const Irma = require('./irma/Irma');
(window.irma = new Irma()).run();