// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

/*global jasmine */
var SpecReporter = require('jasmine-spec-reporter').SpecReporter;
var browserstack = require('browserstack-local');

exports.config = {
  allScriptsTimeout: 11000,
  specs: [
    './e2e/local.js'

   // './e2e/**/*.e2e-spec.ts'

  ],
  'seleniumAddress': 'http://hub-cloud.browserstack.com/wd/hub',

  //'browserstackUser': 'allensnow1',
  //'browserstackKey': '7ADZsXyy9qXY16jC8LYs',
  capabilities: {
    'browserstack.user': 'allensnow1',
   'browserstack.key': '7ADZsXyy9qXY16jC8LYs',
    'build' : 'msal protractor-browserstack',
   // 'browserstack.local': true,
    'resolution': '1024x768',
    'browserName': 'chrome',
    'browserstack.debug': 'true'
 },
  chromeOptions: {
    'args': ['incognito']
  },
  directConnect: true,
  baseUrl: 'http://localhost:4200/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 60000,
    print: function() {}
  },
  useAllAngular2AppRoots: true,

 // beforeLaunch: function() {
   // require('ts-node').register({
    //  project: 'e2e'
   // });
 //},
  onPrepare: function() {
    jasmine.getEnv().addReporter(new SpecReporter());
  },

  // Code to start browserstack local before start of test
  beforeLaunch: function(){
   // require('ts-node').register({
     // project: './e2e/tsconfig.json'
   // });
    console.log("Connecting local");
    return new Promise(function(resolve, reject){
      exports.bs_local = new browserstack.Local();
      exports.bs_local.start({'key': exports.config.capabilities['browserstack.key'] }, function(error) {
        if (error) return reject(error);
        console.log('Connected. Now testing...');

        resolve();
      });
    });
  },

  // Code to stop browserstack local after end of test
  afterLaunch: function(){
    return new Promise(function(resolve, reject){
      exports.bs_local.stop(resolve);
    });
  }

};
