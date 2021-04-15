let exec = require("child_process").exec;

if (parseInt(process.env.BEACHBALL)) {
    // do nothing
} else if (parseInt(process.env.RUNNING_NODE_CI)) {
    console.log("Running scoped bootstrap");
    exec("lerna --scope @azure/* --scope msal --scope vanilla-js-test* --ignore @azure/msal-angularjs bootstrap", function (error, stdout, stderr) {
        if (stdout) {
            console.log('stdout' + stdout);
        }
        console.error('stderr: ' + stderr);
        if (error !== null) {
             console.log('exec error: ' + error);
        }
    });
} else {
    // Update caniuse browser db to ensure we're using up to date browserlist
    exec("lerna exec \"npx browserslist@latest --update-db\"", function (error, stdout, stderr) {
        if (stdout) {
            console.log('browserslist update stdout: ' + stdout);
        }
        console.error('browserslist update stderr: ' + stderr);
        if (error !== null) {
             console.log('browserslist update exec error: ' + error);
        }
    });

    console.log("Running full bootstrap");
    exec("lerna bootstrap", function (error, stdout, stderr) {
        if (stdout) {
            console.log('stdout' + stdout);
        }
        console.error('stderr: ' + stderr);
        if (error !== null) {
             console.log('exec error: ' + error);
        }
    });
}
