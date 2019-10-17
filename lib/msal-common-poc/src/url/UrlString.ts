/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorityConstants, ServerHashParamKeys } from "../utils/Constants";
import { CryptoUtils } from "../utils/CryptoUtils";
import { StringUtils } from "../utils/StringUtils";
import { ServerRequestParameters } from "../request/ServerRequestParameters";
import { IUri } from "./IUri";
import { ClientAuthError } from "../error/ClientAuthError";

/**
 * Url object class which can perform various transformations on url strings.
 */
export class UrlString {

    private urlString: string;
    
    constructor(url: string) {
        this.urlString = url;
        if(StringUtils.isEmpty(this.getHash())) {
            this.urlString = this.canonicalizeUri(url);
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

    validateAsUri() {
        let components;
        try {
            components = this.getUrlComponents();
        } catch (e) {
            throw ClientAuthError.createUrlSegmentError(this.urlString);
        }

        if(!components.Protocol || components.Protocol.toLowerCase() !== "https:") {
            throw ClientAuthError.createInsecureAuthorityUriError(this.urlString);
        }

        if (!components.PathSegments || components.PathSegments.length < 1) {
            throw ClientAuthError.createInvalidAuthorityUriError(this.urlString);
        }
    }

    /**
     * Function to remove query string params from url. Returns the new url.
     * @param url
     * @param name
     */
    urlRemoveQueryStringParameter(name: string): string {
        if (StringUtils.isEmpty(this.urlString)) {
            return this.urlString;
        }

        let regex = new RegExp("(\\&" + name + "=)[^\&]+");
        this.urlString = this.urlString.replace(regex, "");
        // name=value&
        regex = new RegExp("(" + name + "=)[^\&]+&");
        this.urlString = this.urlString.replace(regex, "");
        // name=value
        regex = new RegExp("(" + name + "=)[^\&]+");
        this.urlString = this.urlString.replace(regex, "");
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
        if (tenantId && (pathArray.length !== 0 && (pathArray[0] === AuthorityConstants.COMMON || pathArray[0] === AuthorityConstants.ORGANIZATIONS))) {
            pathArray[0] = tenantId;
        }
        return UrlString.constructAuthorityUriFromObject(urlObject, pathArray);
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
    getDeserializedHash() {
        const hash = this.getHash();
        return CryptoUtils.deserialize(hash);
    }

    /**
     * Parses out the components from a url string.
     * @returns An object with the various components. Please cache this value insted of calling this multiple times on the same url.
     */
    getUrlComponents(): IUri {
        if (!this.urlString) {
            throw ClientAuthError.createUrlSegmentError(this.urlString);
        }

        // https://gist.github.com/curtisz/11139b2cfcaef4a261e0
        const regEx = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");

        const match = this.urlString.match(regEx);

        if (!match || match.length < 6) {
            throw ClientAuthError.createUrlSegmentError(this.urlString);
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

    getUrlString(): string {
        return this.urlString;
    }

    static buildAuthorizationUrl(serverRequestParams: ServerRequestParameters): string {
        const queryParams = this.buildAuthorizationUrlQueryParams(serverRequestParams);
        let authEndpoint: string = serverRequestParams.authorityInstance.authorizationEndpoint;
        // if the endpoint already has queryparams, lets add to it, otherwise add the first one
        if (authEndpoint.indexOf("?") < 0) {
            authEndpoint += "?";
        } else {
            authEndpoint += "&";
        }

        const requestUrl: string = `${authEndpoint}${queryParams.join("&")}`;
        return requestUrl;
    }

    private static buildAuthorizationUrlQueryParams(serverRequestParams: ServerRequestParameters): Array<string> {
        // TODO: fill out
        return new Array<string>();
    }

    static constructAuthorityUriFromObject(urlObject: IUri, pathArray: string[]) {
        return new UrlString(urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + pathArray.join("/"));
    }

    /**
     * @hidden
     * Check if the hash of the URL string contains known properties
     * @ignore
     */
    static hashContainsKnownProperties(url: string): boolean {
        const urlString = new UrlString(url);
        const parameters = urlString.getDeserializedHash();
        return (
            parameters.hasOwnProperty(ServerHashParamKeys.ERROR_DESCRIPTION) ||
            parameters.hasOwnProperty(ServerHashParamKeys.ERROR) ||
            parameters.hasOwnProperty(ServerHashParamKeys.ACCESS_TOKEN) ||
            parameters.hasOwnProperty(ServerHashParamKeys.ID_TOKEN)
        );
    }
}
