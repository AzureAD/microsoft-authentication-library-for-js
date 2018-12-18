// Input capabilities
exports.config = {
    specs: ['e2eCoreTestsSpec.js'],
    capabilities: {
     'browserName' : 'Firefox',
       'browser_version' : '62.0',
       'os' : 'OS X',
       'os_version' : 'High Sierra',
       'resolution' : '1024x768',
       'browserstack.user' : process.env['browserstackUser'],
       'browserstack.key' : process.env['browserstackKey']
    }
}