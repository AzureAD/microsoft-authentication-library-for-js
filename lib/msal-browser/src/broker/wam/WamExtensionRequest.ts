/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { WamExtensionMethod } from "../../utils/BrowserConstants";

export type WamExtensionRequestBody = {
    method: WamExtensionMethod
};

export type WamExtensionRequest = {
    channel: string;
    responseId: number;
    extensionId?: string;
    body: WamExtensionRequestBody
};
