/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    MSI_V1_MIN_VERSION,
    ManagedIdentityQueryParameters,
} from "../../src/utils/Constants.js";

export const checkMSIV1MinimumVersion = (url: string): void => {
    const startIndex =
        url.indexOf(ManagedIdentityQueryParameters.API_VERSION) +
        ManagedIdentityQueryParameters.API_VERSION.length;
    const endIndex = url.indexOf(
        `&${ManagedIdentityQueryParameters.RESOURCE}`,
        startIndex + 1
    );
    const msiVersionUsedDateString: string = url.slice(
        startIndex + 1,
        endIndex
    );
    const msiVersionUsedDateObject: Date = new Date(msiVersionUsedDateString);
    const msiVersionUsedDateMilliseconds = msiVersionUsedDateObject.getTime();

    const msiV1MinVersionMilliseconds: number = new Date(
        MSI_V1_MIN_VERSION
    ).getTime();

    expect(msiVersionUsedDateMilliseconds).toBeGreaterThanOrEqual(
        msiV1MinVersionMilliseconds
    );
};
