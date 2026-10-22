/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { installNestedAppAuthBridge } from "./install.js";

export * from "./index.js";

/**
 * Bridge automatically installed by the browser bundle and `auto` entry point.
 *
 * @public
 */
export const nestedAppAuthBridge = installNestedAppAuthBridge();
