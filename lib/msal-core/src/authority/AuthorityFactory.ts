/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
import { AadAuthority } from "./AadAuthority";
import { B2cAuthority } from "./B2cAuthority";
import { Authority } from "./Authority";
import { StringUtils } from "../utils/StringUtils";
import { B2CTrustedHostList } from "../utils/Constants";

export class AuthorityFactory {

    /**
     * Create an authority object of the correct type based on the url
     * Performs basic authority validation - checks to see if the authority is of a valid type (eg aad, b2c)
     */
    public static CreateInstance(authorityUrl: string, validateAuthority: boolean): Authority {
        if (StringUtils.isEmpty(authorityUrl)) {
            return null;
        }

        // Depending on above detection, create the right type.
        return Object.keys(B2CTrustedHostList).length? new B2cAuthority(authorityUrl, validateAuthority): new AadAuthority(authorityUrl, validateAuthority);
    }

}
