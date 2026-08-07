/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HalResource, HalLinks, HalLink } from "./HalResource.js";

/*
 * A method embedded under `_embedded.methods[]`. Extends HalResource (guaranteeing the
 * HAL shape) and narrows its `_links` to the relations we follow (challenge / verify)
 * while keeping the HAL index signature so unknown relations are preserved.
 */
export interface V2EmbeddedMethod extends HalResource {
    id?: string;
    type?: string;
    hint?: string;
    _links?: HalLinks & {
        challenge?: HalLink;
        verify?: HalLink;
    };
}
