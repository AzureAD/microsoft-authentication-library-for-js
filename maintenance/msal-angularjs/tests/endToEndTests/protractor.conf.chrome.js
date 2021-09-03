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
        'project': 'MsalAngularJS',
        'browserstack.user': process.env.browserstackUser,
        'browserstack.key': process.env.browserstackKey,
        'build': 'MsalAngularJSWinChromeR'
    }
}
