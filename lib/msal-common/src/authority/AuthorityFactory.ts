/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Authority } from "./Authority";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { INetworkModule } from "./../network/INetworkModule";
import { StringUtils } from "./../utils/StringUtils";

export class AuthorityFactory {

    /**
     * Create an authority object of the correct type based on the url
     * Performs basic authority validation - checks to see if the authority is of a valid type (eg aad, b2c)
     */
    public static createInstance(authorityUrl: string, networkInterface: INetworkModule): Authority {
        // Throw error if authority url is empty
        if (StringUtils.isEmpty(authorityUrl)) {
            throw ClientConfigurationError.createUrlEmptyError();
        }

        return new Authority(authorityUrl, networkInterface);
    }
}
