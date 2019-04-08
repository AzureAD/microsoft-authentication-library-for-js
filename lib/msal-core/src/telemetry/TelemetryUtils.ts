import { URL } from 'url';
import { AadAuthority } from '../AadAuthority';
import { B2cAuthority } from '../B2cAuthority'
import sha256 from 'sha256';
import { Utils } from '../Utils';

// This is used to replace the real tenant in telemetry info
const TENANT_PLACEHOLDER = '<tenant>';

export const scrubTenantFromUri = (uri: String): String => {
    const url = new URL(uri);

    //validate absolute?

    //validate trusted host
    if (!AadAuthority.IsInTrustedHostList(url.host)) {
        return null;
    }

    const pathParams = url.pathname.split('/');

    if (pathParams && pathParams.length >= 2) {
        const tenantPosition = pathParams[1] ===  B2cAuthority.B2C_PREFIX ? 2 : 1;
        if (tenantPosition < pathParams.length) {
            pathParams[tenantPosition] = TENANT_PLACEHOLDER;
        }
    }

    const scrubbedPath = pathParams.join('/');
    url.pathname = scrubbedPath;
    return url.href; 
}

export const hashPersonalIdentifier = (valueToHash: String) => {
    // TODO base64
    return Utils.base64EncodeStringUrlSafe(sha256(valueToHash))
}