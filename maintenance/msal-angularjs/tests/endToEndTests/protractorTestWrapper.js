var exec = require('child_process').exec;

var runCount = 0;
var suiteName = 'E2ETests';

var configurationFile = process.argv.slice(2)[0];
console.log(configurationFile);
var runTest = function (testsId) {
    runCount++;
    var testCommand = 'protractor ' + configurationFile;
    if (testsId) {
        testCommand += ' --params.testsId ' + testsId;
    }
    exec(testCommand,
        function (error, stdout, stderr) {
            console.log("Running tests: " + testCommand);
            //if (stdout.indexOf("Failures:") !== -1 || error !== null) {
            //    var testsId = [];
            //    var lines = stdout.toString().split('\n');
            //    lines.forEach(function (line) {
            //        if (line.indexOf(suiteName) !== -1) {
            //            var SpecDetails = line.split(":");
            //            testsId.push(SpecDetails[1]);
            //        }
            //    });
            //    if (testsId.length > 0 && runCount < 3) {
            //        if (testsId.length == 1) testsId.push(testsId[0]);
            //        console.log('stdout: ' + stdout);
            //        console.log("Running tests again. RunCount: " + runCount + " TestsId: " + testsId);
            //        runTest(testsId);
            //    }
            //    else {
            //        console.log(stdout);
            //    }
            //}
            //else {
            //    console.log('stdout: ' + stdout);
            //}

        });
}


runTest();
