// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

export class UriUtils {

    /**
     * Validates that the URI supplied is in canonical form and if not
     * performs the necessary changes in order to canonicalize it
     * @param rawUri 
     */
    static canonicalizeUri(rawUri: string): string {
        let canonicalUri: string;
        if (rawUri) {
            canonicalUri = rawUri.toLowerCase();
        }

        if (rawUri && !UriUtils.endsWith(rawUri, '/')) {
            canonicalUri += "/";
        }
        
        return canonicalUri;
    }

    /**
      * Checks to see if the supplied uri ends with the supplied suffix
      * @param uri
      * @param str
      */
    // TODO: Rename this, not clear what it is supposed to do
    static endsWith(uri: string, suffix: string): boolean {
        if (!uri || !suffix) {
            return false;
        }

        return uri.indexOf(suffix, uri.length - suffix.length) !== -1;
    }

}