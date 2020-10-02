import { runCLI } from "jest";
const { runSample } = require("../index.js");

runSample("silent-flow-aad", 3000).then((server: any) => {
    const args = {
        _: [] as any[],
        $0: '',
        testTimeout: 30000
    };
    
    runCLI(args as any, ['./app/']).then(results => {
        if(server) {
            console.log("E2E tests done, closing server");
            server.close();
        }
    });
});