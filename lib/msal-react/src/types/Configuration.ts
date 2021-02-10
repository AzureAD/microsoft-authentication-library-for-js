/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type Configuration = {
    clientSideNavigate?: (path: string, search?: string, hash?: string) => Promise<void>
};
