/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AADAuthorityConstants, AADServerHashParamKeys } from "../utils/Constants";
import { StringUtils } from "../utils/StringUtils";
import { IUri } from "./IUri";
import { ClientConfigurationError } from "../error/ClientConfigurationError";

/**
 * Url object class which can perform various transformations on url strings.
 */
export class UrlString {

    private _urlString: string;

    public get urlString() {
        return this._urlString;
    }
    
    constructor(url: string) {
        this._urlString = url;
        if(this._urlString && StringUtils.isEmpty(this.getHash())) {
            this._urlString = this.canonicalizeUri(url);
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

        if (url && !url.endsWith("/")) {
            url += "/";
        }

        return url;
    }

    /**
     * Throws if urlString passed is not a valid authority URI string.
     */
    validateAsUri(): void {
        let components;
        try {
            components = this.getUrlComponents();
        } catch (e) {
            throw ClientConfigurationError.createUrlParseError(e);
        }

        if(!components.Protocol || components.Protocol.toLowerCase() !== "https:") {
            throw ClientConfigurationError.createInsecureAuthorityUriError(this.urlString);
        }

        if (!components.PathSegments || components.PathSegments.length < 1) {
            throw ClientConfigurationError.createUrlParseError(`Given url string: ${this.urlString}`);
        }
    }

    /**
     * Function to remove query string params from url. Returns the new url.
     * @param url
     * @param name
     */
    urlRemoveQueryStringParameter(name: string): string {
        if (StringUtils.isEmpty(this.urlString)) {
            throw ClientConfigurationError.createUrlEmptyError();
        }

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
     * @hidden
     * @ignore
     *
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
     * @hidden
     * Returns deserialized portion of URL hash
     * @ignore
     */
    getDeserializedHash<T>(): T {
        const hash = this.getHash();
        return StringUtils.queryStringToObject<T>(hash);
    }

    /**
     * Parses out the components from a url string.
     * @returns An object with the various components. Please cache this value insted of calling this multiple times on the same url.
     */
    getUrlComponents(): IUri {
        if (!this.urlString) {
            throw ClientConfigurationError.createUrlEmptyError();
        }

        // https://gist.github.com/curtisz/11139b2cfcaef4a261e0
        const regEx = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");

        const match = this.urlString.match(regEx);
        
        if (!match) {
            throw ClientConfigurationError.createUrlParseError(`Given url string: ${this.urlString}`);
        }

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

    static constructAuthorityUriFromObject(urlObject: IUri) {
        return new UrlString(urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + urlObject.PathSegments.join("/"));
    }

    /**
     * @hidden
     * Check if the hash of the URL string contains known properties
     * @ignore
     */
    static hashContainsKnownProperties(url: string): boolean {
        const urlString = new UrlString(url);
        const parameters = urlString.getDeserializedHash<any>();
        return (
            parameters.hasOwnProperty(AADServerHashParamKeys.ERROR_DESCRIPTION) ||
            parameters.hasOwnProperty(AADServerHashParamKeys.ERROR) ||
            parameters.hasOwnProperty(AADServerHashParamKeys.CODE)
        );
    }
}
