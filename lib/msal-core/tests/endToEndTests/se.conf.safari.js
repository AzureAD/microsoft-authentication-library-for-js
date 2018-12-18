// Input capabilities
exports.config = {
    specs: ['e2eCoreTestsSpec.js'],
    capabilities: {
     'browserName' : 'Safari',
       'browser_version' : '11.1',
       'os' : 'OS X',
       'os_version' : 'High Sierra',
       'resolution' : '1024x768',
       'browserstack.user' : process.env['browserstackUser'],
       'browserstack.key' : process.env['browserstackKey']
    }
}
