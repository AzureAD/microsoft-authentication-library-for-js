/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface HalLink {
    href: string;
    templated?: boolean;
    name?: string;
}

// A relation may map to a single link or an array of links.
export type HalLinks = Record<string, HalLink | HalLink[]>;

export type HalEmbedded = Record<string, HalResource | HalResource[]>;

export interface HalResource {
    _links?: HalLinks;
    _embedded?: HalEmbedded;
}
