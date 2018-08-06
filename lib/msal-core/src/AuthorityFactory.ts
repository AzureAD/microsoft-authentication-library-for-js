/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * @hidden
 */
import { Utils } from "./Utils";
import { AadAuthority } from "./AadAuthority";
import { B2cAuthority } from "./B2cAuthority";
import { Authority, AuthorityType } from "./Authority";
import { ErrorMessage } from "./ErrorMessage";

export class AuthorityFactory {
    /*
    * Parse the url and determine the type of authority
    */
    private static DetectAuthorityFromUrl(authorityUrl: string): AuthorityType {
        authorityUrl = Utils.CanonicalizeUri(authorityUrl);
        let components = Utils.GetUrlComponents(authorityUrl);
        let pathSegments = components.PathSegments;
        switch (pathSegments[0]) {
            case "tfp":
                return AuthorityType.B2C;
            case "adfs":
                return AuthorityType.Adfs;
            default:
                return AuthorityType.Aad;
        }
    }

    /*
    * Create an authority object of the correct type based on the url
    * Performs basic authority validation - checks to see if the authority is of a valid type (eg aad, b2c)
    */
    public static CreateInstance(authorityUrl: string, validateAuthority: boolean): Authority {
        let type = AuthorityFactory.DetectAuthorityFromUrl(authorityUrl);
        // Depending on above detection, create the right type.
        switch (type) {
            case AuthorityType.B2C:
                return new B2cAuthority(authorityUrl, validateAuthority);
            case AuthorityType.Aad:
                return new AadAuthority(authorityUrl, validateAuthority);
            default:
                throw ErrorMessage.invalidAuthorityType;
        }
    }

}
