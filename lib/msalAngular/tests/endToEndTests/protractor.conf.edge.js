exports.config = {
    framework: 'jasmine',
    'seleniumAddress': 'https://hub-cloud.browserstack.com/wd/hub',
    specs: ['e2eTestsSpec.js'],
    capabilities: {
        'os': 'Windows',
        'os_version': '10',
        'browserName': 'Edge',
        "loggingPrefs": { "browser": "ALL" },
        'browser_version': '13.0',
        'resolution': '1024x768', 
        'browserstack.ie.enablePopups': true,
        'project': 'msalAngular',
        'browserstack.user': process.env.browserstackUser,
        'browserstack.key': process.env.browserstackKey,
        'build': 'msalAngularWinEdgeR'
    },
}