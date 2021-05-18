/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerAuthorizationCodeResponse } from "../response/ServerAuthorizationCodeResponse";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ClientAuthError } from "../error/ClientAuthError";
import { StringUtils } from "../utils/StringUtils";
import { IUri } from "./IUri";
import { AADAuthorityConstants, Constants } from "../utils/Constants";

/**
 * Url object class which can perform various transformations on url strings.
 */
export class UrlString {

    // internal url string field
    private _urlString: string;
    public get urlString(): string {
        return this._urlString;
    }
    
    constructor(url: string) {
        this._urlString = url;
        if (StringUtils.isEmpty(this._urlString)) {
            // Throws error if url is empty
            throw ClientConfigurationError.createUrlEmptyError();
        }

        if (StringUtils.isEmpty(this.getHash())) {
            this._urlString = UrlString.canonicalizeUri(url);
        }
    }

    /**
     * Ensure urls are lower case and end with a / character.
     * @param url 
     */
    static canonicalizeUri(url: string): string {
        if (url) {
            let lowerCaseUrl = url.toLowerCase();

            if (StringUtils.endsWith(lowerCaseUrl, "?")) {
                lowerCaseUrl = lowerCaseUrl.slice(0, -1);
            } else if (StringUtils.endsWith(lowerCaseUrl, "?/")) {
                lowerCaseUrl = lowerCaseUrl.slice(0, -2);
            }

            if (!StringUtils.endsWith(lowerCaseUrl, "/")) {
                lowerCaseUrl += "/";
            }

            return lowerCaseUrl;
        }

        return url;
    }

    /**
     * Throws if urlString passed is not a valid authority URI string.
     */
    validateAsUri(): void {
        // Attempts to parse url for uri components
        let components;
        try {
            components = this.getUrlComponents();
        } catch (e) {
            throw ClientConfigurationError.createUrlParseError(e);
        }

        // Throw error if URI or path segments are not parseable.
        if (!components.HostNameAndPort || !components.PathSegments) {
            throw ClientConfigurationError.createUrlParseError(`Given url string: ${this.urlString}`);
        }

        // Throw error if uri is insecure.
        if(!components.Protocol || components.Protocol.toLowerCase() !== "https:") {
            throw ClientConfigurationError.createInsecureAuthorityUriError(this.urlString);
        }
    }

    /**
     * Function to remove query string params from url. Returns the new url.
     * @param url
     * @param name
     */
    urlRemoveQueryStringParameter(name: string): string {
        let regex = new RegExp("(\\&" + name + "=)[^\&]+");
        this._urlString = this.urlString.replace(regex, "");
        // name=value&
        regex = new RegExp("(" + name + "=)[^\&]+&");
        this._urlString = this.urlString.replace(regex, "");
        // name=value
        regex = new RegExp("(" + name + "=)[^\&]+");
        this._urlString = this.urlString.replace(regex, "");
        return this.urlString;
    }

    /**
     * Given a url and a query string return the url with provided query string appended
     * @param url 
     * @param queryString 
     */
    static appendQueryString(url: string, queryString: string): string {
        if (StringUtils.isEmpty(queryString)) {
            return url;
        }

        return url.indexOf("?") < 0 ? `${url}?${queryString}` : `${url}&${queryString}`;
    }

    /**
     * Returns a url with the hash removed
     * @param url 
     */
    static removeHashFromUrl(url: string): string {
        return UrlString.canonicalizeUri(url.split("#")[0]);
    }

    /**
     * Given a url like https://a:b/common/d?e=f#g, and a tenantId, returns https://a:b/tenantId/d
     * @param href The url
     * @param tenantId The tenant id to replace
     */
    replaceTenantPath(tenantId: string): UrlString {
        const urlObject = this.getUrlComponents();
        const pathArray = urlObject.PathSegments;
        if (tenantId && (pathArray.length !== 0 && (pathArray[0] === AADAuthorityConstants.COMMON || pathArray[0] === AADAuthorityConstants.ORGANIZATIONS))) {
            pathArray[0] = tenantId;
        }
        return UrlString.constructAuthorityUriFromObject(urlObject);
    }

    /**
     * Returns the anchor part(#) of the URL
     */
    getHash(): string {
        return UrlString.parseHash(this.urlString);
    }

    /**
     * Parses out the components from a url string.
     * @returns An object with the various components. Please cache this value insted of calling this multiple times on the same url.
     */
    getUrlComponents(): IUri {
        // https://gist.github.com/curtisz/11139b2cfcaef4a261e0
        const regEx = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");

        // If url string does not match regEx, we throw an error
        const match = this.urlString.match(regEx);
        if (!match) {
            throw ClientConfigurationError.createUrlParseError(`Given url string: ${this.urlString}`);
        }

        // Url component object
        const urlComponents = {
            Protocol: match[1],
            HostNameAndPort: match[4],
            AbsolutePath: match[5],
            QueryString: match[7]
        } as IUri;

        let pathSegments = urlComponents.AbsolutePath.split("/");
        pathSegments = pathSegments.filter((val) => val && val.length > 0); // remove empty elements
        urlComponents.PathSegments = pathSegments;

        if (!StringUtils.isEmpty(urlComponents.QueryString) && urlComponents.QueryString.endsWith("/")) {
            urlComponents.QueryString = urlComponents.QueryString.substring(0, urlComponents.QueryString.length-1);
        }
        return urlComponents;
    }

    static getDomainFromUrl(url: string): string {
        const regEx = RegExp("^([^:/?#]+://)?([^/?#]*)");

        const match = url.match(regEx);

        if (!match) {
            throw ClientConfigurationError.createUrlParseError(`Given url string: ${url}`);
        }

        return match[2];
    }

    static getAbsoluteUrl(relativeUrl: string, baseUrl: string): string {
        if (relativeUrl[0] === Constants.FORWARD_SLASH) {
            const url = new UrlString(baseUrl);
            const baseComponents = url.getUrlComponents();

            return baseComponents.Protocol + "//" + baseComponents.HostNameAndPort + relativeUrl;
        }
        
        return relativeUrl;
    }
    
    /**
     * Parses hash string from given string. Returns empty string if no hash symbol is found.
     * @param hashString 
     */
    static parseHash(hashString: string): string {
        const hashIndex1 = hashString.indexOf("#");
        const hashIndex2 = hashString.indexOf("#/");
        if (hashIndex2 > -1) {
            return hashString.substring(hashIndex2 + 2);
        } else if (hashIndex1 > -1) {
            return hashString.substring(hashIndex1 + 1);
        }
        return "";
    }

    static constructAuthorityUriFromObject(urlObject: IUri): UrlString {
        return new UrlString(urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + urlObject.PathSegments.join("/"));
    }

    /**
     * Returns URL hash as server auth code response object.
     */
    static getDeserializedHash(hash: string): ServerAuthorizationCodeResponse {
        // Check if given hash is empty
        if (StringUtils.isEmpty(hash)) {
            return {};
        }
        // Strip the # symbol if present
        const parsedHash = UrlString.parseHash(hash);
        // If # symbol was not present, above will return empty string, so give original hash value
        const deserializedHash: ServerAuthorizationCodeResponse = StringUtils.queryStringToObject<ServerAuthorizationCodeResponse>(StringUtils.isEmpty(parsedHash) ? hash : parsedHash);
        // Check if deserialization didn't work
        if (!deserializedHash) {
            throw ClientAuthError.createHashNotDeserializedError(JSON.stringify(deserializedHash));
        }
        return deserializedHash;
    }

    /**
     * Check if the hash of the URL string contains known properties
     */
    static hashContainsKnownProperties(hash: string): boolean {
        if (StringUtils.isEmpty(hash)) {
            return false;
        }

        const parameters: ServerAuthorizationCodeResponse = UrlString.getDeserializedHash(hash);
        return !!(
            parameters.code ||
            parameters.error_description ||
            parameters.error ||
            parameters.state
        );
    }
}
