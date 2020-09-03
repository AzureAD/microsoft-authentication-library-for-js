import { runCLI } from "jest";
const { runSample, terminateServer } = require("../index.js");

runSample("silent-flow", 3000, "AAD", null);
const args = {
    _: [] as any[],
    $0: '',
    testTimeout: 30000
};

runCLI(args as any, ['./app/silent-flow']).then(results => {
    terminateServer();
})

