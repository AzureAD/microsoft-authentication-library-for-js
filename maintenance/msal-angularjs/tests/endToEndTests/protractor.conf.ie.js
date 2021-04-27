exports.config = {
    framework: 'jasmine',
   'seleniumAddress': 'https://hub-cloud.browserstack.com/wd/hub',
    specs: ['e2eTestsSpec.js'],
    capabilities: {
        'os': 'WINDOWS',
        'os_version': '10',
        'browserName': 'IE',
        "loggingPrefs": { "browser": "ALL" },
        'browser_version': '11.0',
        'resolution': '1024x768', 
        'browserstack.user': process.env.BROWSERSTACK_USERNAME,
        'browserstack.key': process.env.BROWSERSTACK_PASSWORD,
        'browserstack.ie.enablePopups': true,
        'project': 'MSALJs',
        'build': 'MSALJsWinIER',
        'resolution': '1024x768'
    },
}
