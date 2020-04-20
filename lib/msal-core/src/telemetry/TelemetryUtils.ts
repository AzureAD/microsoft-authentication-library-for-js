import { B2cAuthority } from "../authority/B2cAuthority";
import { AADTrustedHostList } from "../utils/Constants";
import { TENANT_PLACEHOLDER, EVENT_NAME_PREFIX } from "./TelemetryConstants";
import { CryptoUtils } from "../utils/CryptoUtils";
import { UrlUtils } from "../utils/UrlUtils";

export const scrubTenantFromUri = (uri: string): String => {

    const url = UrlUtils.GetUrlComponents(uri);

    // validate trusted host
    if (!AADTrustedHostList[url.HostNameAndPort.toLocaleLowerCase()]) {
        /**
         * returning what was passed because the library needs to work with uris that are non
         * AAD trusted but passed by users such as B2C or others.
         * HTTP Events for instance can take a url to the open id config endpoint
         */
        return uri;
    }

    const pathParams = url.PathSegments;

    if (pathParams && pathParams.length >= 2) {
        const tenantPosition = pathParams[1] ===  "tfp" ? 2 : 1;
        if (tenantPosition < pathParams.length) {
            pathParams[tenantPosition] = TENANT_PLACEHOLDER;
        }
    }

    return  `${url.Protocol}//${url.HostNameAndPort}/${pathParams.join("/")}`;
};

export const hashPersonalIdentifier = (valueToHash: string) => {
    /*
     * TODO sha256 this
     * Current test runner is being funny with node libs that are webpacked anyway
     * need a different solution
     */
    return CryptoUtils.base64Encode(valueToHash);
};

export const prependEventNamePrefix = (suffix: string): string => `${EVENT_NAME_PREFIX}${suffix || ""}`;
