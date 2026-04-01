/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export { acquireMtlsMsiToken, clearMtlsMsiTokenCache, makeMtlsMsiRequest } from "./MtlsMsiClient.js";
export type { MtlsMsiTokenRequest, MtlsMsiRequestOptions, MtlsMsiResponse } from "./MtlsMsiClient.js";
export { getPlatformMetadata } from "./ImdsClient.js";
export type { PlatformMetadata } from "./ImdsClient.js";
