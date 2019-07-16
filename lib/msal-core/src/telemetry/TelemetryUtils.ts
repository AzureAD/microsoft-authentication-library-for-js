import { B2cAuthority } from "../B2cAuthority";
import { AADTrustedHostList } from "../Constants";
import { TENANT_PLACEHOLDER } from "./TelemetryConstants";
import { Utils } from "../Utils";



export const scrubTenantFromUri = (uri: string): String => {

    const url = Utils.GetUrlComponents(uri);

    // validate trusted host
    if (!AADTrustedHostList[url.HostNameAndPort.toLocaleLowerCase()]) {
        // Should this return null or what was passed?
        return null;
    }

    const pathParams = url.PathSegments;

    if (pathParams && pathParams.length >= 2) {
        const tenantPosition = pathParams[1] ===  B2cAuthority.B2C_PREFIX ? 2 : 1;
        if (tenantPosition < pathParams.length) {
            pathParams[tenantPosition] = TENANT_PLACEHOLDER;
        }
    }

    return  `${url.Protocol}//${url.HostNameAndPort}/${pathParams.join("/")}`;
};

export const hashPersonalIdentifier = (valueToHash: string) => {
    // TODO sha256 this
    // Current test runner is being funny with node libs that are webpacked anyway
    // need a different solution
    return Utils.base64EncodeStringUrlSafe(valueToHash);
};
