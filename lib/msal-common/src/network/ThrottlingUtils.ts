/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NetworkResponse } from "./NetworkManager";
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { Constants, HeaderNames } from "../utils/Constants";
import { CacheManager } from "../cache/CacheManager";
import { StringUtils } from "../utils/StringUtils";
import { ServerError } from "../error/ServerError";

export type RequestThumbprint = {
    clientId: string;
    authority: string;
    scopes: Array<string>;
    homeAccountIdentifier?: string;
}

export type RequestThumbprintValue = {
    // Unix-time value representing the expiration of the throttle
    throttleTime: number;
    // Information provided by the server
    error?: string;
    errorCodes?: Array<string>;
    errorMessage?: string;
    subError?: string;
}

export class ThrottlingUtils {

    static generateThrottlingStorageKey(thumbprint: RequestThumbprint): string {
        return `${Constants.THROTTLE_PREFIX}.${JSON.stringify(thumbprint)}`;
    }

    static preProcess(cacheManager: CacheManager, thumbprint: RequestThumbprint): void {
        const key = ThrottlingUtils.generateThrottlingStorageKey(thumbprint);
        const storageValue = cacheManager.getItem(key) as string;

        if (storageValue) {
            const parsedValue = StringUtils.jsonParseHelper(storageValue);

            if (parsedValue && parsedValue.throttleTime >= Date.now()) {
                cacheManager.removeItem(key);
                return;
            }

            throw new ServerError(parsedValue.errorCodes, parsedValue.errorDescription, parsedValue.subError);
        }
    }    

    static postProcess(cacheManager: CacheManager, thumbprint: RequestThumbprint, response: NetworkResponse<ServerAuthorizationTokenResponse>): void {
        const thumbprintValue: RequestThumbprintValue = {
            throttleTime: ThrottlingUtils.calculateThrottleTime(parseInt(response.headers.get(HeaderNames.RETRY_AFTER))),
            error: response.body.error,
            errorCodes: response.body.error_codes,
            errorMessage: response.body.error_description,
            subError: response.body.suberror
        };
        cacheManager.setItem(
            ThrottlingUtils.generateThrottlingStorageKey(thumbprint),
            JSON.stringify(thumbprintValue)
        );
    }

    static checkResponseStatus(response: NetworkResponse<ServerAuthorizationTokenResponse>): boolean {
        return response.status == 429 || response.status >= 500 && response.status < 600;
    }

    static checkResponseForRetryAfter(response: NetworkResponse<ServerAuthorizationTokenResponse>): boolean {
        return response.headers.has(HeaderNames.RETRY_AFTER) && (response.status < 200 || response.status >= 300)
    }

    private static calculateThrottleTime(throttleTime: number): number {
        return Math.min(throttleTime || Date.now() + Constants.DEFAULT_THROTTLE_TIME_MS, Constants.DEFAULT_MAX_THROTTLE_TIME_MS);
    }
}