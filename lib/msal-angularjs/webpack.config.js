const path = require('path');
var UnminifiedWebpackPlugin = require('unminified-webpack-plugin');

module.exports = {
    entry: './lib/msal-angular.js',
    output: {
        filename: 'msal-angular.min.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new UnminifiedWebpackPlugin()
    ]
};