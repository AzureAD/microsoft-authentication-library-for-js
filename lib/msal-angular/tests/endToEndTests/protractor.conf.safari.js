exports.config = {
    framework: 'jasmine',
    'seleniumAddress': 'http://hub-cloud.browserstack.com/wd/hub',
    specs: ['e2eTestsSpec.js'],
    capabilities: {
        'os': 'OS X',
        'os_version': 'Yosemite',
        'browserName': 'Safari',
        "loggingPrefs": { "browser": "ALL" },
        'browser_version': '8.0',
        'resolution': '1024x768',
        'browserstack.user': process.env.browserstackUser,
        'browserstack.key': process.env.browserstackKey,
        'browserstack.safari.enablePopups': true,
        'browserstack.selenium_version': '2.44.0',
        'browserstack.safari.driver': '2.48',
        'project': 'MSALAngular',
        'build': 'MSALAngularMacSafariR'
    },
}
