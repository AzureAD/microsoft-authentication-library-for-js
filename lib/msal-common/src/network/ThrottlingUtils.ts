/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NetworkResponse } from "./NetworkManager";
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { Constants, HeaderNames } from "../utils/Constants";
import { CacheManager } from "../cache/CacheManager";
import { StringUtils } from "../utils/StringUtils";

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

    static generateThrottlingStorageKey(thumbprint: RequestThumbprint | RequestThumbprintValue): string {
        return `${Constants.THROTTLE_PREFIX}.${JSON.stringify(thumbprint)}`;
    }

    static preProcess(cacheManager: CacheManager, thumbprint: RequestThumbprint): void {
        const key = ThrottlingUtils.generateThrottlingStorageKey(thumbprint);
        const storageValue = cacheManager.getItem(key) as string;

        if (storageValue) {
            const parsedValue = StringUtils.jsonParseHelper(storageValue);

            if (parsedValue.throttleTime >= Date.now()) {
                cacheManager.removeItem(key);
                return;
            }
            // TODO: implement this error
            // ThrottleError extends ServerError and adds a message about how long the request is throttled for
            // throw new ThrottleError(storageValue.throttleTime, storageValue.error, storageValue.errorDescription, storageValue.subError);
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
            ThrottlingUtils.generateThrottlingStorageKey(thumbprintValue)
        );
    }

    public static checkResponseStatus(response: NetworkResponse<ServerAuthorizationTokenResponse>): boolean {
        return response.status == 429 || response.status >= 500 && response.status < 600;
    }

    public static checkResponseForRetryAfter(response: NetworkResponse<ServerAuthorizationTokenResponse>): boolean {
        return response.headers.has(HeaderNames.RETRY_AFTER) && (response.status < 200 || response.status >= 300)
    }

    private static calculateThrottleTime(throttleTime: number): number {
        return Math.min(throttleTime || Date.now() + Constants.DEFAULT_THROTTLE_TIME_MS, Constants.DEFAULT_MAX_THROTTLE_TIME_MS);
    }
}