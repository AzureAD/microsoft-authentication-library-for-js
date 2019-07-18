// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { strict as assert } from 'assert';
import * as url from 'url';

import { UriError } from './Error/UriError';

/**
 * The UriUtils class exposes static utility methods
 * that deal with validating, processing and building URIs
 */

export class UriUtils {
    /**
     * Validates that the URI supplied is in canonical form and if not
     * performs the necessary changes in order to canonicalize it
     * @param rawUri
     */
    static canonicalizeUri(rawUri: string): string {
        // Assert non-empty input
        assert(rawUri, UriError.createUriRequiredError(rawUri));

        // Parse input URI to normalize each part
        const urlElements = url.parse(rawUri, true);

        // Rebuild URI in canonical form
        let canonicalUri = `${urlElements.protocol}//${urlElements.host}${urlElements.path}`;

        // Add trailing forward slash if missing
        if (!UriUtils.validateSuffix(canonicalUri, '/')) {
            canonicalUri += '/';
        }

        return canonicalUri;
    }

    /**
     * Checks to see if the supplied uri ends with the supplied suffix
     * @param uri
     * @param suffix
     */
    static validateSuffix(uri: string, suffix: string): boolean {
        if (!uri || !suffix) {
            return false;
        }
        return uri.indexOf(suffix, uri.length - suffix.length) !== -1;
    }

}
