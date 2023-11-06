/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Logger,
    ServerAuthorizationCodeResponse,
    UrlUtils,
} from "@azure/msal-common";
import {
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../error/BrowserAuthError";

export function deserializeResponse(
    responseString: string,
    responseLocation: string,
    logger: Logger
): ServerAuthorizationCodeResponse {
    // Deserialize hash fragment response parameters.
    const serverParams = UrlUtils.getDeserializedResponse(responseString);
    if (!serverParams) {
        if (!UrlUtils.stripLeadingHashOrQuery(responseString)) {
            // Hash or Query string is empty
            logger.error(
                `The request has returned to the redirectUri but a ${responseLocation} is not present. It's likely that the ${responseLocation} has been removed or the page has been redirected by code running on the redirectUri page.`
            );
            throw createBrowserAuthError(BrowserAuthErrorCodes.hashEmptyError);
        } else {
            logger.error(
                `A ${responseLocation} is present in the iframe but it does not contain known properties. It's likely that the ${responseLocation} has been replaced by code running on the redirectUri page.`
            );
            logger.errorPii(
                `The ${responseLocation} detected is: ${responseString}`
            );
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.hashDoesNotContainKnownProperties
            );
        }
    }
    return serverParams;
}
