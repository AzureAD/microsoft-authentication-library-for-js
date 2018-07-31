exports.config = {
    framework: 'jasmine',
   'seleniumAddress': 'https://hub-cloud.browserstack.com/wd/hub',
    specs: ['e2eTestsSpec.js'],
    capabilities: {
        'os': 'Windows',
        'os_version': '7',
        'browserName': 'IE',
        "loggingPrefs": { "browser": "ALL" },
        'browser_version': '11.0',
        'resolution': '1024x768',
        'browserstack.user': process.env.browserstackUser,
        'browserstack.key': process.env.browserstackKey,
        'browserstack.ie.enablePopups': true,
        'project': 'msalAngular',
        'build': 'msalAngularWinIER'
    },
}
