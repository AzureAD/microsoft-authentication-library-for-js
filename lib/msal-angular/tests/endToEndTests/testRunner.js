var exec = require('child_process').exec;
var fs = require('fs');

var configurationFiles = [
    "protractor.conf.chrome.js",
    // "protractor.conf.firefox.js",
    // "protractor.conf.ie.js",
    //"protractor.conf.safari.js",
    //"protractor.conf.androidNexus5.js",
    // "protractor.conf.edge.js",
];

var i = 0;

var inputConfigurationFiles = process.argv.slice(2)[0];
if (inputConfigurationFiles != null) {
    configurationFiles = inputConfigurationFiles.split(",");
}

var secretIds = {
    msaljs_browserstack_user: 'msaljs-browserstack-user',
    msaljs_browserstack_key: 'msaljs-browserstack-key',
    msidlab4: 'msidlab4',
    MSA_MSIDLAB4_Password: 'MSA-MSIDLAB4-Password'
}

var runProtractorConfiguration = function () {
    console.log("Running " + configurationFiles[i]);
    var keyVault = require('./keyVault');
    keyVault.getAllSecrets(secretIds).then(function (result) {
        process.env.browserstackKey = result.msaljs_browserstack_key;
        process.env.browserstackUser = result.msaljs_browserstack_user;
        process.env.loginPassword = result.loginPassword;
        process.env.MSA_MSIDLAB4_Password = result.MSA_MSIDLAB4_Password;

        var testCommand = 'protractor ' + configurationFiles[i] + ' --parameters.login=' + result.value;
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
