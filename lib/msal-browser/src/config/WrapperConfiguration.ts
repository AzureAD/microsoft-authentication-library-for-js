/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Configuration Options for Wrapper Libraries
 */
export type WrapperConfiguration = {
    clientSideNavigate?: (path: string, search?: string, hash?: string) => Promise<boolean>;
};

export function buildWrapperConfiguration(config: WrapperConfiguration): Required<WrapperConfiguration> {
    const DEFAULT_OPTIONS: Required<WrapperConfiguration> = {
        clientSideNavigate: () => Promise.resolve(false)
    };

    return {...DEFAULT_OPTIONS, ...config};
}
