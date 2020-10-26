exports.config = {
    framework: 'jasmine',
    'seleniumAddress': 'https://hub-cloud.browserstack.com/wd/hub',
    specs: ['e2eTestsSpec.js'],
    capabilities: {
        'os': 'Windows',
        'os_version': '7',
        'browserName': 'firefox',
        "loggingPrefs": { "browser": "ALL" },
        'browser_version': '47.0',
        'resolution': '1024x768', 
        'project': 'msalAngular',
        'browserstack.user': process.env.browserstackUser,
        'browserstack.key': process.env.browserstackKey,
        'build': 'msalAngularWinFirefoxR'
    },
}

