var exec = require('child_process').exec;

var configurationFiles = [
    "se.conf.chrome.js",
//    "se.conf.firefox.js"
];

var i = 0;

var runSeleniumConfig = function () {
    var configFile =  configurationFiles[i];
    console.log("Running " + configFile);
    var config = require('./' + configFile);
    var testCommand = 'mocha spec/e2eCoreTestsSpec.js ' + configFile;
    exec(testCommand, function(error, stdout, stderr) {
        console.log("Completed " + configFile);
        console.log(stdout);
        if(error) {
            console.log(error);
            console.log(stderr);
        }
        i++;
        if(i < configurationFiles.length) {
            runSeleniumConfig();
        }
    });
}

runSeleniumConfig();