const SpecReporter = require('jasmine-spec-reporter').SpecReporter;
const jasmineReporters = require("jasmine-reporters");
exports.config = {
    framework: 'jasmine',
    'seleniumAddress': 'https://hub-cloud.browserstack.com/wd/hub',
    specs: ['e2eTestsSpec.js'],
    capabilities: {
        'os': 'WINDOWS',
        'os_version': '7',
        'browserName': 'chrome',
        "loggingPrefs": { "browser": "ALL" },
        'browser_version': '48.0',
        'resolution': '1024x768', 
        'project': 'msalAngular',
        'browserstack.user': process.env.browserstackUser,
        'browserstack.key': process.env.browserstackKey,
        'build': 'msalAngularWinChromeR'
    },
    onPrepare: function () {
        jasmine
            .getEnv()
            .addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
        jasmine.getEnv().addReporter(
            new jasmineReporters.JUnitXmlReporter({
                consolidateAll: true,
                savePath: "results",
                filePrefix: "e2e-results-junit"
            })
        );
    },
    plugins: [
        {
            package: require.resolve('protractor-console-plugin'),
            failOnWarning: false,
            failOnError: true,
            logWarnings: true
        }
    ]
}