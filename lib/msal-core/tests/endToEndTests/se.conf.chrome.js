// Input capabilities
exports.config = {
    specs: ['e2eCoreTestsSpec.js'],
    capabilities: {
     'browserName' : 'Chrome',
     'browser_version' : '62.0',
     'os' : 'Windows',
     'os_version' : '10',
     'resolution' : '1024x768',
     'browserstack.user' : process.env['browserstackUser'],
     'browserstack.key' : process.env['browserstackKey']
    }
}