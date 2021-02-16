/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NavigationOptions } from "./NavigationOptions";

export interface INavigationClient {
    navigateInternal(url: string, options: NavigationOptions): Promise<boolean>;
    navigateExternal(url: string, options: NavigationOptions): Promise<void>;
}
