import sha256 from "sha256";
import { B2cAuthority } from "../B2cAuthority";
import { TrustedHostList } from "../Constants";
import { Utils } from "../Utils";

// This is used to replace the real tenant in telemetry info
const TENANT_PLACEHOLDER = "<tenant>";

export const scrubTenantFromUri = (uri: string): String => {

    const url = Utils.GetUrlComponents(uri);

    // validate trusted host
    console.log(url.HostNameAndPort);
    if (!TrustedHostList[url.HostNameAndPort.toLocaleLowerCase()]) {
        // Should this return null or what was passed?
        return uri;
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
    // TODO base64
    return Utils.base64EncodeStringUrlSafe(sha256(valueToHash));
};
