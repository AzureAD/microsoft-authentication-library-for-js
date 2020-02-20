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
import { ClientConfigurationErrorMessage } from "../error/ClientConfigurationError";
import { StringUtils } from "../utils/StringUtils";

export class AuthorityFactory {

    /**
     * Create an authority object of the correct type based on the url
     * Performs basic authority validation - checks to see if the authority is of a valid type (eg aad, b2c)
     */
    public static CreateInstance(authorityUrl: string, validateAuthority: boolean, authorityType: string): Authority {
        if (StringUtils.isEmpty(authorityUrl)) {
            return null;
        }

        // Depending on above detection, create the right type.
        switch (authorityType.toLowerCase()) {
            case "b2c":
                return new B2cAuthority(authorityUrl, validateAuthority);
            case "aad":
                return new AadAuthority(authorityUrl, validateAuthority);
            default:
                throw ClientConfigurationErrorMessage.invalidAuthorityType;
        }
    }

}
