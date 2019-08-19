/**
 * This configuration file is used by webpack to build irma project. It build all js files
 * into one, inserts final "irma.js" into "index.html", created source-map file and put all
 * files into "dist" folder.
 *
 * @author flatline
 */
const path     = require('path');
const Cleaner  = require('clean-webpack-plugin');
/**
 * {String} Determine development mode. Possible values: 'development', 'production'.
 * In package.json may be set as parameter: npx webpack --mode=development
 */
const NODE_ENV = process.env.NODE_ENV;
/**
 * {Boolean} Means development mode. In this mode we have to suppress code minification
 * and add source maps into it for debug
 */
const DEV_MODE = NODE_ENV === 'development';

module.exports = {
    mode   : NODE_ENV,
    entry  : './src/Main.js',
    watch  : DEV_MODE,
    devtool: DEV_MODE ? 'source-map' : 'source-map', // 'source-map' doesn't work with karma

    module : {
        rules: [
            {test: /\.html$/, use: 'ignore-loader'}
        ]
    },
    plugins: [
        new Cleaner(['./dist/*.js', './dist/*.map'])
    ],
    output : {
        filename: 'irma.js',
        path    : path.resolve(__dirname, './dist')
    }
}