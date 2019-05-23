var webpackConfig = require('./webpack.config');
const path = require('path');

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['mocha', 'chai'],
        files: [
            'node_modules/babel-polyfill/dist/polyfill.js',
            'test/**/*.ts',
        ],
        exclude: [
            'test/oldTests/*'
        ],
        preprocessors: {
            'test/**/*.ts': ['webpack', 'sourcemap'],
            'src/**/ *.ts': ['coverage']
        },
        webpack: {
            mode: webpackConfig.mode,
            module: webpackConfig.module,
            resolve: webpackConfig.resolve,
            performance: {
                hints: false
            }
        },
        client: {
            chai: {
                config: {
                    includeStack: false
                }
            }
        },
        reporters: ['verbose'],
        port: 8080,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['PhantomJS'],
        singleRun: true,
        concurrency: Infinity,
        customLaunchers: {
            FirefoxHeadless: {
                base: 'Firefox',
                flags: ['-headless'],
            },
        },
    });
}
