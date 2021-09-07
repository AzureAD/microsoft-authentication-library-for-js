const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = [
    {
        mode: 'development',
        entry: './src/renderer.ts',
        target: 'electron-renderer',
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    include: [/src/],
                    use: [{ loader: 'ts-loader' }]
                }
            ]
        },
        output: {
            path: __dirname + '/dist',
            filename: 'renderer.js'
        },
        resolve: {
            extensions: ['.ts', '.js'],
            modules: ['node_modules', path.resolve(__dirname + 'src')]
        },
        optimization: {
            minimizer: [
                new TerserPlugin({
                    parallel: true,
                    terserOptions: {
                        compress: {
                            reduce_vars: false,
                        }
                    }
                })
            ]
        }
    },
    {
        mode: 'development',
        entry: './src/main.ts',
        target: 'electron-main',
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    include: [/src/],
                    use: [{ loader: 'ts-loader'}]
                },
                {
                    test: /\.node$/,
                    use: [{ loader: 'node-loader' }]
                }
            ]
        },
        output: {
            path: __dirname + '/dist',
            filename: 'main.js'
        },
        resolve: {
            extensions: ['.ts', '.js'],
            modules: ['node_modules', path.resolve(__dirname + 'src')]
        },
        node: {
            __dirname: false,
        },
        optimization: {
            minimizer: [
                new TerserPlugin({
                    parallel: true,
                    terserOptions: {
                        compress: {
                            reduce_vars: false
                        }
                    }
                })
            ]
        }
    }
]