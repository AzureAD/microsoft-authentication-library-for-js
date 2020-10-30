/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonDeviceCodeRequest , DeviceCodeResponse } from "@azure/msal-common";

export type DeviceCodeRequest = Partial<Omit<CommonDeviceCodeRequest, "scopes"|"deviceCodeCallback"|"resourceRequestMethod"|"resourceRequestUri">> & {
    scopes: Array<string>;
    deviceCodeCallback: (response: DeviceCodeResponse) => void;
};
