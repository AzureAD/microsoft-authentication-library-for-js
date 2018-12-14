var path = require("path");
var webpack = require("webpack");

var PATHS = {
    entryPoint: path.resolve(__dirname, 'src/index.ts'),
    bundles: path.resolve(__dirname, 'dist'),
}

var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {

    entry: {
        'msal': [PATHS.entryPoint],
        'msal.min': [PATHS.entryPoint]
    },

    mode: 'production',

    output: {
        path: PATHS.bundles,
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'Msal',
        umdNamedDefine: true
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },

    devtool: 'source-map',
    plugins: [
        new ForkTsCheckerWebpackPlugin()
    ],
    module: {

        rules: [{
            test: /\.(ts|tsx)?$/,
            use: {
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                }
            },
            exclude: /(node_modules)/
        }]

    }
}