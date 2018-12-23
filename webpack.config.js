const path    = require('path');
const Cleaner = require('clean-webpack-plugin');

module.exports = {
    entry  : './src/Irma.js',
    devtool: 'source-map',
    output : {
        filename: 'irma.js',
        path    : path.resolve(__dirname, './dist')
    },
    module : {
        loaders: [
            {test: /\.html$/, loader: 'ignore-loader'}
        ]
    },
    plugins: [
        new Cleaner(['./dist/*.js', './dist/*.map'])
    ]
};