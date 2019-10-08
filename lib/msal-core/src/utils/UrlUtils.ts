/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IUri } from "../IUri";
import { Constants, SSOTypes } from "./Constants";
import { ServerRequestParameters } from "../ServerRequestParameters";
import { ScopeSet } from "../ScopeSet";
import { StringUtils } from "./StringUtils";
import { CryptoUtils } from "./CryptoUtils";

/**
 * @hidden
 */
export class UrlUtils {

    /**
     * Returns current window URL as redirect uri
     */
    static getDefaultRedirectUri(): string {
        return window.location.href.split("?")[0].split("#")[0];
    }

    /**
     * Given a url like https://a:b/common/d?e=f#g, and a tenantId, returns https://a:b/tenantId/d
     * @param href The url
     * @param tenantId The tenant id to replace
     */
    static replaceTenantPath(url: string, tenantId: string): string {
        url = url.toLowerCase();
        const urlObject = this.GetUrlComponents(url);
        const pathArray = urlObject.PathSegments;
        if (tenantId && (pathArray.length !== 0 && (pathArray[0] === Constants.common || pathArray[0] === SSOTypes.ORGANIZATIONS))) {
            pathArray[0] = tenantId;
        }
        return this.constructAuthorityUriFromObject(urlObject, pathArray);
    }

    static constructAuthorityUriFromObject(urlObject: IUri, pathArray: string[]) {
        return this.CanonicalizeUri(urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + pathArray.join("/"));
    }

    /**
     * Parses out the components from a url string.
     * @returns An object with the various components. Please cache this value insted of calling this multiple times on the same url.
     */
    static GetUrlComponents(url: string): IUri {
        if (!url) {
            throw "Url required";
        }

        // https://gist.github.com/curtisz/11139b2cfcaef4a261e0
        const regEx = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");

        const match = url.match(regEx);

        if (!match || match.length < 6) {
            throw "Valid url required";
        }

        const urlComponents = <IUri>{
            Protocol: match[1],
            HostNameAndPort: match[4],
            AbsolutePath: match[5]
        };

        let pathSegments = urlComponents.AbsolutePath.split("/");
        pathSegments = pathSegments.filter((val) => val && val.length > 0); // remove empty elements
        urlComponents.PathSegments = pathSegments;
        return urlComponents;
    }

    /**
     * Given a url or path, append a trailing slash if one doesnt exist
     *
     * @param url
     */
    static CanonicalizeUri(url: string): string {
        if (url) {
            url = url.toLowerCase();
        }

        if (url && !UrlUtils.endsWith(url, "/")) {
            url += "/";
        }

        return url;
    }

    /**
     * Checks to see if the url ends with the suffix
     * Required because we are compiling for es5 instead of es6
     * @param url
     * @param str
     */
    // TODO: Rename this, not clear what it is supposed to do
    static endsWith(url: string, suffix: string): boolean {
        if (!url || !suffix) {
            return false;
        }

        return url.indexOf(suffix, url.length - suffix.length) !== -1;
    }

    /**
     * Utils function to remove the login_hint and domain_hint from the i/p extraQueryParameters
     * @param url
     * @param name
     */
    static urlRemoveQueryStringParameter(url: string, name: string): string {
        if (StringUtils.isEmpty(url)) {
            return url;
        }

        let regex = new RegExp("(\\&" + name + "=)[^\&]+");
        url = url.replace(regex, "");
        // name=value&
        regex = new RegExp("(" + name + "=)[^\&]+&");
        url = url.replace(regex, "");
        // name=value
        regex = new RegExp("(" + name + "=)[^\&]+");
        url = url.replace(regex, "");
        return url;
    }

    /**
     * @hidden
     * @ignore
     *
     * Returns the anchor part(#) of the URL
     */
    static getHashFromUrl(urlStringOrFragment: string): string {
        const hashIndex1 = urlStringOrFragment.indexOf("#");
        const hashIndex2 = urlStringOrFragment.indexOf("#/");
        if (hashIndex2 > -1) {
            return urlStringOrFragment.substring(hashIndex2 + 2);
        } else if (hashIndex1 > -1) {
            return urlStringOrFragment.substring(hashIndex1 + 1);
        }
        return urlStringOrFragment;
    }

    /**
     * @hidden
     * Check if the url contains a hash with known properties
     * @ignore
     */
    static urlContainsHash(urlString: string): boolean {
        const parameters = UrlUtils.deserializeHash(urlString);
        return (
            parameters.hasOwnProperty(Constants.errorDescription) ||
            parameters.hasOwnProperty(Constants.error) ||
            parameters.hasOwnProperty(Constants.accessToken) ||
            parameters.hasOwnProperty(Constants.idToken)
        );
    }

    /**
     * @hidden
     * Returns deserialized portion of URL hash
     * @ignore
     */
    static deserializeHash(urlFragment: string) {
        const hash = UrlUtils.getHashFromUrl(urlFragment);
        return CryptoUtils.deserialize(hash);
    }
}
