/**
 * Karma configuration file
 *
 * @author flatline
 */
const webpackConfig = require('./webpack.config.js');
/**
 * {Boolean} Means development mode. In this mode we have to suppress code minification
 * and add source maps into it for debug
 */
const DEV_MODE = process.env.NODE_ENV === 'development';

module.exports = function (config) {
    config.set({
        //
        // base path that will be used to resolve all patterns (eg. files, exclude)
        //
        basePath: '',
        //
        // frameworks to use available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        //
        frameworks: ['jasmine'],
        //
        // list of files / patterns to load in the browser
        //
        files: [
            'src/**/*.spec.js'
        ],
        //
        // TODO: this list should be empty
        // list of files / patterns to exclude
        //
        exclude: [
            'src/common/Helper.spec.js',
            'src/irma/BioVM.spec.js',
            'src/irma/Bytes2Code.spec.js',
            'src/irma/Mutations.spec.js'
        ],
        //
        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        // We have to use webpack to support modules and require operator. If you change
        // list of files here, don't forget to change them also in jasmine.json
        //
        preprocessors: {
            'src/**/*.spec.js': ['webpack'] 
        },
        //
        // Configuration of webpack
        //
        webpack: webpackConfig,
        //
        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        //
        reporters: ['progress'],
        //
        // web server port
        //
        port: 9876,
        //
        // enable / disable colors in the output (reporters and logs)
        //
        colors: true,
        //
        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        //
        logLevel: config.LOG_ERROR,
        //
        // enable / disable watching file and executing tests whenever any file changes
        //
        autoWatch: true,
        //
        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        //
        browsers: [ !DEV_MODE ? 'ChromeHeadless' : 'Chrome'],
        //
        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        //
        singleRun: !DEV_MODE,
        //
        // Concurrency level
        // how many browser should be started simultaneous
        //
        concurrency: Infinity
    })
}