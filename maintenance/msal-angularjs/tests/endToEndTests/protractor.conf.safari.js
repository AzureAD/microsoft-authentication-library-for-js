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
        'browserstack.user': process.env.BROWSERSTACK_USERNAME,
        'browserstack.key': process.env.BROWSERSTACK_PASSWORD,
        'browserstack.safari.enablePopups': true,
        'browserstack.selenium_version': '2.44.0',
        'browserstack.safari.driver': '2.48',
        'project': 'adalJs',
        'build': 'adalJsMacSafariR'
    },
}
