/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ApiId } from "../utils/BrowserConstants";

export type NavigationOptions = {
    apiId: ApiId
    timeout: number
    noHistory: boolean
};
