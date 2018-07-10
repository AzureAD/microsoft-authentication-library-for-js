const process = require('process');
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function (config) {
    config.set({
        frameworks: ['jasmine-ajax', 'jasmine'],
        plugins: [
            'karma-phantomjs-launcher',
            'karma-jasmine',
            'karma-jasmine-ajax',
            'karma-coverage',
            'karma-chrome-launcher'
        ],
        // start these browsers
        browsers: ['Chrome', 'ChromeHeadless', 'ChromeHeadlessNoSandbox'],
        reporters: ['progress', 'coverage'],
        preprocessors: {
            'dist/*.js': ['coverage']
        },
        coverageReporter: {
            dir: 'coverage',
            reporters: [
                // reporters not supporting the `file` property
                { type: 'html', subdir: 'report-html' },
                { type: 'lcov', subdir: 'report-lcov' },
                // reporters supporting the `file` property, use `subdir` to directly
                // output them in the `dir` directory
                { type: 'cobertura', subdir: '.', file: 'cobertura.txt' },
                { type: 'lcovonly', subdir: '.', file: 'report-lcovonly.txt' },
            ]
        },
        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: 'ChromeHeadless',
                flags: [
                    '--no-sandbox',
                    '--disable-gpu',
                    // Without a remote debugging port, Google Chrome exits immediately.
                    '--remote-debugging-port=9222',
                ]
            }
        },
        logLevel: config.LOG_INFO,
        singleRun: true
    });
};