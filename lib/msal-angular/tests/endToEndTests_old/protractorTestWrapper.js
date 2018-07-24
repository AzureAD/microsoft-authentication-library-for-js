var exec = require('child_process').exec;

var elementsArray = [
    'uirouter-nopopup-nohtml5-otherwise',
    'uirouter-nopopup-html5-otherwise',
    'uirouter-nopopup-nohtml5-nootherwise',
    'uirouter-nopopup-html5-nootherwise',
    'ngroute-nopopup-nohtml5-otherwise',
    'ngroute-nopopup-nohtml5-nootherwise',
    'ngroute-nopopup-html5-otherwise',
    'ngroute-nopopup-html5-nootherwise',
    //'ngroute-popup-nohtml5-otherwise',
    //'ngroute-popup-nohtml5-nootherwise',
    //'ngroute-popup-html5-otherwise',
    //'ngroute-popup-html5-nootherwise',
    //'uirouter-popup-nohtml5-otherwise',
    //'uirouter-popup-nohtml5-nootherwise',
    //'uirouter-popup-html5-otherwise',
    //'uirouter-popup-html5-nootherwise',
];

var runCount = {};
var passedTests = {};

for (var i = 0; i < elementsArray.length; i++) {
    runCount[elementsArray[i]] = 0;
}
var configurationFile = process.argv.slice(2)[0];
var runTest = function (elementId, testsId) {
    runCount[elementId]++;
    var testCommand = 'protractor ' + configurationFile + ' --params.appSetting ' + elementId;
    if (testsId) {
        testCommand += ' --params.testsId ' + testsId;
    }
    exec(testCommand,
        function (error, stdout, stderr) {
            console.log("Running tests: " + testCommand);
            if (stdout.indexOf("Failures:") !== -1 || error !== null) {
                var testsId = [];
                var startIndex = stdout.indexOf('specs, ');
                var endIndex = stdout.indexOf('failure', startIndex);
                var numFailures = stdout.substring(startIndex + 7, endIndex - 1);
                console.log(numFailures);
                for (var i = 1; i <= numFailures; i++) {
                    var str = i + ") E2ETests ";
                    startIndex = stdout.indexOf(str);
                    endIndex = stdout.indexOf(":", startIndex);
                    testsId.push(stdout.substring(startIndex + str.length, endIndex));
                }
                if (testsId.length > 0 && runCount[elementId] < 3) {
                    if (testsId.length == 1) testsId.push(testsId[0]);
                    console.log('stdout: ' + stdout);
                    console.log("Running tests again. RunCount: " + runCount[elementId] + " TestsId: " + testsId);
                    runTest(elementId, testsId)
                }
                else {
                    console.log('stdout: ' + stdout);
                    console.log('exec error: ' + error);
                }
            }
            else {
                passedTests[elementId]++;
                console.log('stdout: ' + stdout);
            }
        });
}

for (var i = 0; i < elementsArray.length; i++) {
    passedTests[elementsArray[i]] = 0;
    runTest(elementsArray[i]);
}
