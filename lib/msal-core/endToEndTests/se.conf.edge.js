// Input capabilities
exports.config = {
    specs: ['e2eCoreTestsSpec.js'],
    capabilities: {
     'browserName' : 'Edge',
      'browser_version' : '17.0',
      'os' : 'Windows',
      'os_version' : '10',
      'resolution' : '1024x768',
      'browserstack.user' : process.env['browserstackUser'],
      'browserstack.key' : process.env['browserstackKey']
    }
 }