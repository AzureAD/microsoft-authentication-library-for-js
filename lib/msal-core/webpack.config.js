var path = require("path");
var webpack = require("webpack");

var PATHS = {
    entryPoint: path.resolve(__dirname, 'src/index.ts'),
    bundles: path.resolve(__dirname, 'dist'),
}

var ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
    mode: "production",
    entry: {
        'msal': [PATHS.entryPoint],
        'msal.min': [PATHS.entryPoint]
    },
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
            test: /\.(ts|tsx|js)?$/,
            use: {
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                }
            }

        }]
    }
}
