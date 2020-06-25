/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CloudDiscoveryMetadata } from "./CloudDiscoveryMetadata";

/**
 * Key-Value type to support Cloud Discovery Metadata
 */
export type TrustedHostListType = Record<string, CloudDiscoveryMetadata>;
