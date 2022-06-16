exports.config = {
    framework: 'jasmine',
    'seleniumAddress': 'https://hub-cloud.browserstack.com/wd/hub',
    specs: ['e2eTestsSpec.js'],
    capabilities: {
        'platform': 'ANDROID',
        'device': 'Google Nexus 5',
        'browserName': 'android',
        "loggingPrefs": { "browser": "ALL" },
        'browserstack.user': process.env.BROWSERSTACK_USERNAME,
        'browserstack.key': process.env.BROWSERSTACK_PASSWORD,
        'project': 'adalJs',
        'build': 'adalJsAndroidNexus5'
    },
}