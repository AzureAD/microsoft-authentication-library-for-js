var path = require("path");
var webpack = require("webpack");

var PATHS = {
    entryPoint: path.resolve(__dirname, 'src/index.ts'),
    bundles: path.resolve(__dirname, 'dist'),
}

var config = {

    entry: {
        'msal-angular': [PATHS.entryPoint],
        'msal-angular.min': [PATHS.entryPoint]
    },
  
    output: {
        path: PATHS.bundles,
        filename: '[name].js',
        //Which format to export the library:
        //"umd" - Export to AMD, CommonJS2 or as property in root
        libraryTarget: 'umd',
        //If set, export the bundle as library. output.library is the name.

      //  Use this if you are writing a library and want to publish it as single file.
        library: 'MsalAngular',
        //If output.libraryTarget is set to umd and output.library is set, setting this to true will name the AMD module.
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
        }]
    }
}

module.exports = config;