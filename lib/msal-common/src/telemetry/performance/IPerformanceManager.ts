/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "../../error/AuthError";

export interface IPerformanceManager {
    startMeasurement(measureName: string): Function;
}

export const DEFAULT_PERFORMANCE_MANAGER_IMPLEMENTATION = {
    startMeasurement: (): Function => {
        const notImplErr = "Performance Manager Interface - startMeasurement() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    }
};
