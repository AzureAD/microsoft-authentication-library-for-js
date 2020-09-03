import { runCLI, run } from "jest";
const runSample = require("../index.js");

runSample("silent-flow", 3000, "AAD", null);
const args = {
    _: [] as any[],
    $0: '',
    testTimeout: 30000
};
const results = runCLI(args as any, ['./app/silent-flow']);