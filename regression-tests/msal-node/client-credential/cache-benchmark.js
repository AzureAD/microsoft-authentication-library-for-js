/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BENCHMARK_MODES, runBenchmark } from "./cache-workload.js";

const modeIndex = process.argv.indexOf("--mode");
const mode = modeIndex === -1 ? "smoke" : process.argv[modeIndex + 1];
const config = BENCHMARK_MODES[mode];

if (!config) {
    throw new Error(
        `Unknown benchmark mode "${mode}". Expected "smoke" or "full".`,
    );
}

const result = await runBenchmark(config);
console.log(JSON.stringify(result, null, 2));
