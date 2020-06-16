/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface ICachePlugin {
    readFromStorage: () => Promise<string>;
    writeToStorage: (
        getMergedState: (oldState: string) => string
    ) => Promise<void>;
}
