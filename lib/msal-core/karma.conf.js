var webpackConfig = require('./webpack.config');
const path = require('path');

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['mocha'],
        files: [
            'node_modules/babel-polyfill/dist/polyfill.js',
            'tests/**/*.ts',
        ],
        exclude: [
            'tests/MSAL*',
            'tests/Authority.spec.ts'
        ],
        preprocessors: {
            'tests/**/*.ts': ['webpack', 'sourcemap'],
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
        reporters: ['progress'],
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
