/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * HAL (Hypertext Application Language) primitives shared by every V2 server response.
 * The V2 flow is server-driven: each response embeds `_links` (relation -> href) and,
 * for the entry step, `_embedded` resources (e.g. the available auth methods). Later
 * steps follow a stored href rather than a hard-coded path.
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
