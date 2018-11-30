var path = require("path");
var webpack = require("webpack");

var PATHS = {
    entryPoint: path.resolve(__dirname, 'src/index.ts'),
    bundles: path.resolve(__dirname, 'dist'),
}

var config = {

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

        new webpack.optimize.UglifyJsPlugin({
            minimize: true,
            sourceMap: true,
            include: /\.min\.js$/,
        })
    ],
    module: {

        loaders: [{
            test: /\.tsx?$/,
            loader: 'awesome-typescript-loader',
            exclude: /node_modules/,
            query: {
                declaration: false,
            }
        }

        ]
      
    }
}

module.exports = config;