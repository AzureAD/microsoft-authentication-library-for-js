/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * HAL (Hypertext Application Language) primitives shared by every V2 server response.
 * Responses can provide `_links` for subsequent requests and `_embedded`
 * resources such as available authentication methods.
 */

export interface HalLink {
    href: string;
    templated?: boolean;
    name?: string;
}

// A relation may map to a single link or an array of links (the parser takes the first).
export type HalLinks = Record<string, HalLink | HalLink[]>;

export type HalEmbedded = Record<string, HalResource | HalResource[]>;

export interface HalResource {
    _links?: HalLinks;
    _embedded?: HalEmbedded;
}
