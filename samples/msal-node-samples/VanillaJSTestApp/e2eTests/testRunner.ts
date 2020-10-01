import { runCLI } from "jest";
const { runSample, terminateServer } = require("../index.js");

runSample("silent-flow-aad", 3000);
const args = {
    _: [] as any[],
    $0: '',
    testTimeout: 30000
};

runCLI(args as any, ['./app/']).then(results => {
    terminateServer();
});

