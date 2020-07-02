/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ServerAuthorizationCodeResponse } from "../server/ServerAuthorizationCodeResponse";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ClientAuthError } from "../error/ClientAuthError";
import { StringUtils } from "../utils/StringUtils";
import { IUri } from "./IUri";
import { AADAuthorityConstants } from "../utils/Constants";

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
        if (!StringUtils.isEmpty(this._urlString) && StringUtils.isEmpty(this.getHash())) {
            this._urlString = this.canonicalizeUri(url);
        } else if (StringUtils.isEmpty(this._urlString)) {
            // Throws error if url is empty
            throw ClientConfigurationError.createUrlEmptyError();
        }
    }

    /**
     * Ensure urls are lower case and end with a / character.
     * @param url 
     */
    private canonicalizeUri(url: string): string {
        if (url) {
            url = url.toLowerCase();
        }

        if (url && (url.charAt(url.length - 1) !== "/")) {
            url += "/";
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
        if (!components.HostNameAndPort || !components.PathSegments || components.PathSegments.length < 1) {
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
        const hashIndex1 = this.urlString.indexOf("#");
        const hashIndex2 = this.urlString.indexOf("#/");
        if (hashIndex2 > -1) {
            return this.urlString.substring(hashIndex2 + 2);
        } else if (hashIndex1 > -1) {
            return this.urlString.substring(hashIndex1 + 1);
        }
        return "";
    }

    /**
     * Returns deserialized portion of URL hash
     */
    getDeserializedHash<T>(): T {
        const hash = this.getHash();
        const deserializedHash: T = StringUtils.queryStringToObject<T>(hash);
        if (!deserializedHash) {
            throw ClientAuthError.createHashNotDeserializedError(JSON.stringify(deserializedHash));
        }
        return deserializedHash;
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
            AbsolutePath: match[5]
        } as IUri;

        let pathSegments = urlComponents.AbsolutePath.split("/");
        pathSegments = pathSegments.filter((val) => val && val.length > 0); // remove empty elements
        urlComponents.PathSegments = pathSegments;
        return urlComponents;
    }

    static constructAuthorityUriFromObject(urlObject: IUri): UrlString {
        return new UrlString(urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + urlObject.PathSegments.join("/"));
    }

    /**
     * Check if the hash of the URL string contains known properties
     */
    static hashContainsKnownProperties(url: string): boolean {
        if (StringUtils.isEmpty(url)) {
            return false;
        }
        const urlString = new UrlString(url);
        const parameters = urlString.getDeserializedHash<ServerAuthorizationCodeResponse>();
        return !!(
            parameters.code ||
            parameters.error_description ||
            parameters.error ||
            parameters.state
        );
    }
}
