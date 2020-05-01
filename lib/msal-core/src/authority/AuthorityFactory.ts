/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
import { Authority } from "./Authority";
import { StringUtils } from "../utils/StringUtils";

export class AuthorityFactory {   

    /**
     * Create an authority object of the correct type based on the url
     * Performs basic authority validation - checks to see if the authority is of a valid type (eg aad, b2c)
     */
    public static CreateInstance(authorityUrl: string, validateAuthority: boolean): Authority {
        if (StringUtils.isEmpty(authorityUrl)) {
            return null;
        }
        return new Authority(authorityUrl, validateAuthority);
    }
}
