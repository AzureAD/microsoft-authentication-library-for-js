var exec = require('child_process').exec;
var fs = require('fs');

var configurationFiles = [
    "protractor.conf.chrome.js"
    /* "protractor.conf.firefox.js",
    "protractor.conf.ie.js",
    "protractor.conf.safari.js",
    "protractor.conf.androidNexus5.js",
    "protractor.conf.edge.js", */
];

var i = 0;

var inputConfigurationFiles = process.argv.slice(2)[0];
if (inputConfigurationFiles != null) {
    configurationFiles = inputConfigurationFiles.split(",");
}

var secretIds = {
    browserstackUser: 'msaljs-browserstack-user',
    browserstackKey: 'msaljs-browserstack-key'
}

var runProtractorConfiguration = function () {
    console.log("Running " + configurationFiles[i]);
    var keyVault = require('./keyVault');
    keyVault.getAllSecrets(secretIds).then(function (result) {
        process.env.browserstackKey = result.browserstackKey;
        process.env.browserstackUser = result.browserstackUser;
        process.env.loginPassword = result.loginPassword;
        var testCommand = 'protractor ' + configurationFiles[i];
        exec(testCommand,
            function (error, stdout, stderr) {
                console.log("Completed " + configurationFiles[i]);
                console.log(stdout);
                fs.writeFileSync("output-" + configurationFiles[i], stdout);
                i++;
                if (i < configurationFiles.length) {
                    runProtractorConfiguration();
                }
            });
    });
   
}
runProtractorConfiguration();
