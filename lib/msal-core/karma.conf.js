var webpackConfig = require('./webpack.config');
const path = require('path');
module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine-ajax', 'jasmine'],
        files: [
            'node_modules/babel-polyfill/dist/polyfill.js',
            'tests/**/*.ts',
        ],
        exclude: [
        ],
        preprocessors: {
            'tests/**/*.ts': ['webpack', 'sourcemap'],
            'src/**/ *.ts': ['coverage']
        },
        webpack: {
            module: webpackConfig.module,
            resolve: webpackConfig.resolve
        },
        reporters: ['spec', 'coverage-istanbul'],
        port: 8080,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['PhantomJS'],
        singleRun: true,
        concurrency: Infinity,
        coverageIstanbulReporter: {
            reports: ['html', 'lcovonly', 'cobertura'],
            dir: path.join(__dirname, 'coverage'),
            fixWebpackSourcePaths: true
        },
    })
}